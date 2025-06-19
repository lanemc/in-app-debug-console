# Changelog

All notable changes to the In-App Debug Console project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2023-10-15

### Added
- Initial release of In-App Live Debug Console
- Node.js/Express integration with VM-based sandboxing
- Python/Flask integration with InteractiveConsole
- Web-based console UI with command history
- Comprehensive security features:
  - Authentication/authorization integration
  - Code execution timeouts
  - Output length limits
  - Audit logging
  - Session management
- Example applications for both Node.js and Python
- Comprehensive documentation and security guide
- MIT license

### Features
- **Node.js Support**: Express middleware with VM sandbox execution
- **Python Support**: Flask blueprint with InteractiveConsole
- **Security**: Multi-layer security with auth integration and sandboxing
- **Web UI**: Modern, responsive console interface
- **Extensibility**: Configurable globals and custom commands
- **Monitoring**: Built-in stats and session management
- **Examples**: Complete demo applications

### Security
- Code execution in isolated VM contexts
- Configurable authentication checks
- Request/response logging and auditing
- Protection against common attack vectors
- Production-ready security defaults

### Documentation
- Comprehensive README with quick start guide
- Detailed security documentation
- API reference and configuration options
- Examples and best practices
- Installation and setup instructions

---

## Future Releases

### Planned Features
- Ruby on Rails integration
- WebSocket support for real-time output
- Multi-instance coordination
- IDE integrations
- Enhanced auto-completion
- Plugin system for custom commands
- Advanced sandboxing options
- Performance monitoring integration

### Potential Integrations
- Next.js API routes support
- Django framework support
- Java/Spring Boot support
- Go web framework support
- Database query builders
- Cloud platform integrations (AWS Lambda, Vercel, Heroku)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.

## Versioning

This project uses [Semantic Versioning](https://semver.org/). For the versions available, see the [tags on this repository](https://github.com/smart-console-debugger/in-app-debug-console/tags).