FROM grafana/grafana:latest

# Copy configuration files
COPY ./provisioning /etc/grafana/provisioning
COPY ./dashboards /var/lib/grafana/dashboards

# Add any custom plugins if needed
ENV GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource,grafana-postgresql-datasource

# Configure security
ENV GF_SECURITY_ADMIN_PASSWORD=admin123
ENV GF_USERS_ALLOW_SIGN_UP=false

# Configure anonymous access if needed
# ENV GF_AUTH_ANONYMOUS_ENABLED=true

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000
