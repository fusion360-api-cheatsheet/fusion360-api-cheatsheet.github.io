
<div align="center" style="font-size: 22pt;"> 
  <h1 style="text-align: center;">Fusion 360 API Interactive Cheat Sheet</h1>
<p align="center">
  <img src="assets/chrome_test.gif" alt="Demo of Fusion 360 API Interactive Cheat Sheet" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
</p>
</div>

An interactive web-based visualization of the Fusion 360 API structure, allowing users to click on any API element to access its documentation.

## Features

- **Interactive SVG Map**: Visual representation of the Fusion 360 API structure
- **Clickable Elements**: Click on any API element to open its documentation in a new tab
- **Search Functionality**: Search for specific API elements with real-time highlighting
- **Zoom Controls**: Zoom in/out for better viewing of the diagram
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Use Ctrl/Cmd + +/- for zoom, Ctrl/Cmd + 0 to reset

## How to Use

1. **View the Diagram**: The main SVG diagram shows the Fusion 360 API structure
2. **Click Elements**: Click on any text element in the diagram to open its documentation
3. **Search**: Use the search box to find specific API elements
4. **Zoom**: Use the zoom controls or keyboard shortcuts to adjust the view
5. **Info Panel**: Click the "Info" button to see additional information

## Files

- `index.html` - Main web page with interactive functionality
- `path12046.svg` - The Fusion 360 API cheat sheet diagram
- `links.log` - Mapping of API element names to their documentation URLs
- `Fusion_API_CheatSheet.pdf` - Original PDF version of the cheat sheet

## Deployment to GitHub Pages

### Option 1: Automatic Deployment

1. Push this repository to GitHub
2. Go to your repository settings
3. Scroll down to "GitHub Pages" section
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### Option 2: Manual Deployment

1. Clone this repository
2. Ensure all files are in the root directory
3. Push to GitHub
4. Enable GitHub Pages in repository settings

### Option 3: Using GitHub CLI

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-repo-name>

# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Enable GitHub Pages (if you have GitHub CLI installed)
gh repo edit --enable-pages
```

## Local Development

To run this locally:

1. Clone the repository
2. Open `index.html` in a web browser
3. Or serve it using a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## API Documentation Links

The application automatically loads API documentation links from `links.log`. Each line in the file follows the format:

```
APIElementName -> https://help.autodesk.com/view/fusion360/cloudhelp/ENU/Fusion-360-API/files/APIElementName.htm
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **SVG Processing**: Client-side SVG parsing and manipulation
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Performance**: Optimized for large SVG files with efficient DOM manipulation

## Contributing

To add new API elements or improve the visualization:

1. Fork the repository
2. Add new entries to `links.log` if needed
3. Update the SVG file if the API structure changes
4. Submit a pull request

## License

This project is provided as-is for educational and reference purposes. The Fusion 360 API documentation is property of Autodesk.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all files are present in the repository
3. Verify that the SVG file is accessible
4. Check that the links.log file is properly formatted

## Acknowledgments

- Autodesk for the Fusion 360 API documentation
- Original creators of the Fusion 360 API cheat sheet
- GitHub for providing free hosting via GitHub Pages 