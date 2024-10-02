#!/bin/bash

# Function to create a new iTerm2 tab and run a command
new_iterm_tab() {
    osascript <<EOF
    tell application "iTerm2"
        tell current window
            create tab with default profile
            tell current session
                write text "$1"
            end tell
        end tell
    end tell
EOF
}

# Change to the project directory (adjust this path as needed)
cd /Users/zacharynickerson/Desktop/vokko

# Start the Python server
new_iterm_tab "cd livekitt && cd venv && python3 main.py dev"

# Wait a moment to ensure the first tab has time to start
sleep 2

# Start the token API server
new_iterm_tab "cd server && node token-api.mjs"

# Wait another moment
sleep 2

# Start the React Native app
new_iterm_tab "npm start"

# Wait for the React Native packager to start
sleep 5

# Send 'y' to use an alternative port
new_iterm_tab "echo y"

# Wait a moment
sleep 2

# Send 'i' to open iOS simulator
new_iterm_tab "echo i"

echo "All processes started. Check the iTerm2 tabs for any errors."