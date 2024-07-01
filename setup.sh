#!/bin/bash

# Step 1: Install Node.js and Yarn if not already installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null
then
    echo "Node.js could not be found. Please install it from https://nodejs.org/"
    exit
fi

echo "Checking Yarn installation..."
if ! command -v yarn &> /dev/null
then
    echo "Yarn could not be found. Installing Yarn..."
    npm install -g yarn
fi

# Step 2: Install project dependencies
echo "Installing project dependencies..."
yarn install

# Step 3: Clear cache (optional)
echo "Clearing cache..."
npx expo start -c

# Step 4: Start the Expo development server
echo "Starting Expo development server..."
npx expo start