FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# Copy dependencies
COPY package*.json ./
COPY requirements.txt ./

RUN npm install
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
