# Pair 'em Up 🎮

A strategic number-matching puzzle game built with vanilla JavaScript.

## 🎯 Game Objective

Clear the grid by finding and removing valid pairs of numbers to reach 100+ points before running out of moves.

## 🎮 Game Modes

- **Classic**: Sequential numbers 1-19 (excluding 0) in order
- **Random**: Same numbers in random positions  
- **Chaotic**: 27 random numbers from 1-9

## 🎲 Game Rules

### Valid Pairs
- **Identical numbers**: Same numbers (e.g., 7 and 7) = 1 point
- **Sum to 10**: Numbers that add to 10 (e.g., 3 and 7) = 2 points
- **Double fives**: Special bonus (5 and 5) = 3 points

### Connectivity Rules
- Adjacent cells (horizontal/vertical)
- Same row/column with clear path between
- Last cell of row can pair with first cell of next row

## 🪄 Assist Tools

- **Hints**: Shows available moves count (∞ uses)
- **Revert**: Undo last move (1 use per move)
- **Add Numbers**: Adds more numbers (10 uses max)
- **Shuffle**: Rearranges existing numbers (5 uses max)
- **Eraser**: Remove any single number (5 uses max)

## 🏆 Win/Lose Conditions

- **Win**: Reach 100+ points
- **Lose**: No moves available AND no assists left, OR 50-line grid limit reached

## 🎨 Features

- **Responsive Design**: Works on 380px-1280px screens
- **Audio System**: Sound effects for all interactions
- **Theme Support**: Light/Dark mode switching
- **Game Persistence**: Save/load game state
- **Statistics**: Track last 5 games with results
- **Visual Feedback**: Animations for valid/invalid pairs

## 🚀 Getting Started

1. Open `index.html` in your browser
2. Choose a game mode
3. Click numbers to select pairs
4. Use assist tools strategically
5. Reach 100 points to win!

## 🛠️ Technical Details

- **Pure JavaScript**: No frameworks or external libraries
- **Local Storage**: Game state and settings persistence
- **CSS Grid**: Responsive 9-column game layout
- **Web Audio API**: Dynamic sound generation
- **Modern ES6+**: Classes, arrow functions, template literals

## 📱 Browser Support

Optimized for latest Chrome browser with full functionality.

---

Built as part of RS School JavaScript course project.