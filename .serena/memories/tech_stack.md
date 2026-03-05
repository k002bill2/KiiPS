# KiiPS Tech Stack

The project uses a modern enterprise stack focused on stability and modularity.

## Backend
- **Language**: Java 8 (1.8.x)
- **Framework**: Spring Boot 2.4.2
- **Microservices**: Spring Cloud Gateway (KIIPS-APIGateway), Spring Cloud (2020.0.0)
- **Data Access**: MyBatis (inferred from `architecture.md` mention of `${}` SQL injection), Spring Boot Data access layer.
- **Database**: PostgreSQL (via `architecture.md` mention of PostgreSQL connection tests).
- **Communication**: REST APIs over HTTP/JSON.

## Frontend
- **Technology**: JSP (JavaServer Pages)
- **Styling**: SCSS (compiled to CSS), Bootstrap
- **JS Libraries**: jQuery, ApexCharts
- **Grid Component**: RealGrid 2.6.3
- **Security**: Lucy XSS Filter (for JSP)

## DevOps & Tools
- **Build System**: Maven (Multi-module)
- **Version Control**: SVN (Subversion)
- **Deployment**: Shell scripts (`start.sh`, `stop.sh`, `build_*.sh`)
- **Environment**: Darwin (MacOS) for development.
