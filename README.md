# Start containerized server
docker build -t leaderboard-app .
docker run --rm -p 3001:3001 leaderboard-app