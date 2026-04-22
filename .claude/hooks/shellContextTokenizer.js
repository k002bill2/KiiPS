/**
 * Shell Context Tokenizer
 *
 * 정규식 매치 offset이 shell 소스 내에서 문자열 리터럴·주석·heredoc 본문
 * 안에 있는지 판정합니다.
 *
 * 목적:
 *   ethicalValidator.js / permissionGate.js 의 위험 패턴 정규식이 실제 명령이
 *   아닌 literal/comment/heredoc 내부 텍스트를 매치하여 발생하는 false positive
 *   를 제거합니다.
 *
 * 의도적 범위 제한:
 *   - 공개 함수 1개: isInsideShellLiteralOrComment(source, offset)
 *   - 완전한 AST 파싱이 아닌 offset-based state scan
 *   - 의존성 0 (순수 JS)
 *
 * 알려진 한계 (harness-boundaries.md 참조):
 *   - DQUOTE 내부의 $(...) / backtick 은 현재 STATE_DQUOTE 를 유지하여 "literal
 *     내부" 로 분류됩니다. 예: `bash -c "rm $(evil_cmd)"` 의 `rm` 매치는
 *     DQUOTE 안에서 발견되어 isInsideShellLiteralOrComment === true 가 되고,
 *     가드가 차단을 skip 할 수 있습니다. 실제 shell 실행 의미상 $() 내부는
 *     새 명령 문맥이므로 차단되어야 하나, 본 tokenizer 는 이를 구분하지 않습니다.
 *   - 회피/해결: docs/harness-boundaries.md §1 참조.
 *   - 해결 시에는 STATE stack 을 도입하여 DQUOTE 중 '$(' 에 OUTSIDE 재진입,
 *     ')' 에서 복귀하는 방식이 필요합니다.
 *
 * @version 1.0.1 (한계 주석 정정 — drift 수정)
 */

"use strict";

const STATE_OUTSIDE = 0;
const STATE_SQUOTE = 1; // '...'
const STATE_DQUOTE = 2; // "..."
const STATE_COMMENT = 3; // # ... \n
const STATE_HEREDOC = 4; // <<EOF ... \nEOF\n

const HEREDOC_TERMINATORS = new Set([" ", "\t", "\n", ";", "|", "&", "<", ">"]);

/**
 * <<[-]DELIM 마커를 파싱하여 delim 문자열과 종료 offset을 반환.
 * 인용된 delim('DELIM'·"DELIM"·\DELIM)도 지원.
 *
 * @param {string} source
 * @param {number} startOffset - `<<` 직후 오프셋
 * @returns {{delim: string, stripTabs: boolean, endOffset: number}|null}
 */
function parseHeredocMarker(source, startOffset) {
  let i = startOffset;
  let stripTabs = false;
  if (source[i] === "-") {
    stripTabs = true;
    i++;
  }
  while (source[i] === " " || source[i] === "\t") i++;

  let quote = null;
  if (source[i] === '"' || source[i] === "'") {
    quote = source[i];
    i++;
  } else if (source[i] === "\\") {
    i++;
  }

  let delim = "";
  while (i < source.length) {
    const c = source[i];
    if (quote) {
      if (c === quote) {
        i++;
        break;
      }
    } else if (HEREDOC_TERMINATORS.has(c)) {
      break;
    }
    delim += c;
    i++;
  }

  if (!delim) return null;
  return { delim, stripTabs, endOffset: i };
}

/**
 * 주어진 offset이 shell 리터럴·주석·heredoc 본문 내부인지 판정.
 *
 * @param {string} source - shell 소스 코드 (명령 한 줄도 허용)
 * @param {number} targetOffset - 판정할 offset
 * @returns {boolean} literal/comment/heredoc 내부면 true, 아니면 false
 */
function isInsideShellLiteralOrComment(source, targetOffset) {
  if (typeof source !== "string") return false;
  if (!Number.isInteger(targetOffset)) return false;
  if (targetOffset < 0 || targetOffset >= source.length) return false;

  let state = STATE_OUTSIDE;
  let heredocDelim = null;
  let heredocStripTabs = false;
  let pendingHeredoc = null;
  let escapeNext = false;

  for (let i = 0; i < source.length; i++) {
    if (i === targetOffset) {
      return state !== STATE_OUTSIDE;
    }

    const ch = source[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    switch (state) {
      case STATE_OUTSIDE: {
        if (ch === "\n" && pendingHeredoc) {
          state = STATE_HEREDOC;
          heredocDelim = pendingHeredoc.delim;
          heredocStripTabs = pendingHeredoc.stripTabs;
          pendingHeredoc = null;
          break;
        }
        if (ch === "\\") {
          escapeNext = true;
          break;
        }
        if (ch === "#" && (i === 0 || /\s/.test(source[i - 1]))) {
          state = STATE_COMMENT;
          break;
        }
        if (ch === "'") {
          state = STATE_SQUOTE;
          break;
        }
        if (ch === '"') {
          state = STATE_DQUOTE;
          break;
        }
        if (ch === "<" && source[i + 1] === "<" && !pendingHeredoc) {
          const marker = parseHeredocMarker(source, i + 2);
          if (marker) {
            if (targetOffset >= i && targetOffset < marker.endOffset) {
              return false;
            }
            pendingHeredoc = {
              delim: marker.delim,
              stripTabs: marker.stripTabs,
            };
            i = marker.endOffset - 1;
          }
        }
        break;
      }

      case STATE_SQUOTE:
        if (ch === "'") state = STATE_OUTSIDE;
        break;

      case STATE_DQUOTE:
        if (ch === "\\") {
          escapeNext = true;
          break;
        }
        if (ch === '"') state = STATE_OUTSIDE;
        break;

      case STATE_COMMENT:
        if (ch === "\n") state = STATE_OUTSIDE;
        break;

      case STATE_HEREDOC:
        if (ch === "\n" && heredocDelim) {
          let lineStart = i + 1;
          if (heredocStripTabs) {
            while (source[lineStart] === "\t") lineStart++;
          }
          let lineEnd = lineStart;
          while (lineEnd < source.length && source[lineEnd] !== "\n") lineEnd++;
          const line = source.slice(lineStart, lineEnd);
          if (line === heredocDelim) {
            state = STATE_OUTSIDE;
            heredocDelim = null;
            heredocStripTabs = false;
          }
        }
        break;
    }
  }

  return false;
}

/**
 * 편의 함수: 정규식 결과를 받아 매치가 literal/comment/heredoc 내부면 필터.
 *
 * @param {string} source
 * @param {RegExpExecArray|{index: number}} match
 * @returns {boolean} 매치가 실제 코드 위치에 있으면 true (차단 유지)
 */
function isRealCodeMatch(source, match) {
  if (!match || !Number.isInteger(match.index)) return true;
  return !isInsideShellLiteralOrComment(source, match.index);
}

/**
 * 전체 source 스캔 후 최종 state 가 STATE_OUTSIDE 인지 판정 (v1.0.2, Issue #2 보강).
 *
 * Edit 의 new_string / old_string 같은 부분 shell source 세그먼트가 unclosed quote/
 * heredoc 을 포함하면 AST 필터가 state 누출로 false-negative 를 유발할 수 있음.
 * 세그먼트별 AST 적용 전 본 함수로 well-formed 확인 → unclosed 시 regex-only fallback.
 *
 * @param {string} source
 * @returns {boolean} 모든 state 가 닫혀있으면 true
 */
function isWellFormed(source) {
  if (typeof source !== "string") return false;

  let state = STATE_OUTSIDE;
  let heredocDelim = null;
  let heredocStripTabs = false;
  let pendingHeredoc = null;
  let escapeNext = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    switch (state) {
      case STATE_OUTSIDE: {
        if (ch === "\n" && pendingHeredoc) {
          state = STATE_HEREDOC;
          heredocDelim = pendingHeredoc.delim;
          heredocStripTabs = pendingHeredoc.stripTabs;
          pendingHeredoc = null;
          break;
        }
        if (ch === "\\") {
          escapeNext = true;
          break;
        }
        if (ch === "#" && (i === 0 || /\s/.test(source[i - 1]))) {
          state = STATE_COMMENT;
          break;
        }
        if (ch === "'") {
          state = STATE_SQUOTE;
          break;
        }
        if (ch === '"') {
          state = STATE_DQUOTE;
          break;
        }
        if (ch === "<" && source[i + 1] === "<" && !pendingHeredoc) {
          const marker = parseHeredocMarker(source, i + 2);
          if (marker) {
            pendingHeredoc = {
              delim: marker.delim,
              stripTabs: marker.stripTabs,
            };
            i = marker.endOffset - 1;
          }
        }
        break;
      }
      case STATE_SQUOTE:
        if (ch === "'") state = STATE_OUTSIDE;
        break;
      case STATE_DQUOTE:
        if (ch === "\\") {
          escapeNext = true;
          break;
        }
        if (ch === '"') state = STATE_OUTSIDE;
        break;
      case STATE_COMMENT:
        if (ch === "\n") state = STATE_OUTSIDE;
        break;
      case STATE_HEREDOC:
        if (ch === "\n" && heredocDelim) {
          let lineStart = i + 1;
          if (heredocStripTabs) while (source[lineStart] === "\t") lineStart++;
          let lineEnd = lineStart;
          while (lineEnd < source.length && source[lineEnd] !== "\n") lineEnd++;
          if (source.slice(lineStart, lineEnd) === heredocDelim) {
            state = STATE_OUTSIDE;
            heredocDelim = null;
            heredocStripTabs = false;
          }
        }
        break;
    }
  }

  // STATE_COMMENT 는 파일 끝에서 well-formed 로 간주 (shell 도 그렇게 처리)
  return (
    (state === STATE_OUTSIDE || state === STATE_COMMENT) && !pendingHeredoc
  );
}

module.exports = {
  isInsideShellLiteralOrComment,
  isRealCodeMatch,
  isWellFormed,
  _parseHeredocMarker: parseHeredocMarker,
};
