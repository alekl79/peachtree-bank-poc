FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy the project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the source code
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Create a data directory for the SQLite database
RUN mkdir -p /app/data

# Copy the SQLite database file
COPY transactions.db /app/data/

# Copy the published app
COPY --from=build /app/out .

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:7080/hc || exit 1

EXPOSE 7080
ENTRYPOINT ["dotnet", "peachtree-bank-api.dll"]
