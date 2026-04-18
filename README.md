# To run ensure you are in the main project directory and type "npm run dev"

# Start containerized server
docker build -t leaderboard-app .
docker run --rm -p 3001:3001 leaderboard-app