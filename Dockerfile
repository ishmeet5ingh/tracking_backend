FROM node:20.17.0

# Install build tools to build native modules like bcrypt
RUN apt-get update && apt-get install -y python3 g++ make

# Set the working directory in the container
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Rebuild bcryptjs to ensure compatibility
RUN npm rebuild bcryptjs --build-from-source

# Copy the rest of the application source code
COPY . .

# Expose the port your backend listens on
EXPOSE 5000

# Node environment
ENV NODE_ENV=production

# MONGODB_URI and PORT will be passed at runtime from docker run
CMD ["node", "index.js"]
