# Fusion 360 API Interactive Cheat Sheet

An interactive web-based cheat sheet for the Fusion 360 API, featuring hover tooltips with detailed class information and direct links to official documentation.

## 🌟 Features

- **Interactive SVG Diagram**: Clickable dots positioned at each API element
- **Hover Tooltips**: Detailed information about each API class including:
  - Class inheritance
  - Methods and properties
  - Documentation strings
- **Direct Documentation Links**: One-click access to official Fusion 360 API documentation
- **Responsive Design**: Works on desktop and mobile devices
- **PDF-Based Positioning**: Accurate positioning using PDF coordinate mapping

## 📁 Project Structure

```
deployment/
├── index.html                    # Main application file
├── assets/
│   └── path12046.svg            # Interactive SVG diagram
├── data/
│   ├── links.log                # API name to documentation URL mapping
│   ├── pdf_text_mapping.json    # PDF coordinates for positioning
│   └── api_class_info.json      # Detailed API class information
├── docs/
│   └── README.md                # This documentation
├── css/                         # Stylesheets (future use)
├── js/                          # JavaScript files (future use)
└── .github/workflows/
    └── deploy.yml               # GitHub Actions deployment workflow
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Fusion360_api_web/deployment
   ```

2. **Start local server**:
   ```bash
   python3 -m http.server 8000
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

### Deployment

#### GitHub Pages (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and `/deployment` folder
   - Save

3. **Automatic deployment**:
   - The GitHub Actions workflow will automatically deploy on push
   - Your site will be available at: `https://yourusername.github.io/your-repo-name/`

#### Alternative Deployment Options

- **Netlify**: Drag and drop the `deployment` folder to Netlify
- **Vercel**: Connect your GitHub repository to Vercel
- **Traditional hosting**: Upload all files from `deployment` folder to your web server

## 🛠️ Technical Details

### Data Files

- **`links.log`**: Maps API class names to their documentation URLs
- **`pdf_text_mapping.json`**: Contains PDF coordinates for accurate dot positioning
- **`api_class_info.json`**: Detailed information about each API class

### Key Technologies

- **HTML5**: Semantic markup and modern features
- **CSS3**: Responsive design with modern styling
- **JavaScript (ES6+)**: Interactive functionality and API handling
- **SVG**: Vector graphics for the interactive diagram

### Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📊 API Coverage

- **Total API Classes**: 1,095+ classes
- **Interactive Elements**: 565+ clickable dots
- **Documentation Links**: Direct links to official Autodesk documentation
- **Class Information**: Methods, properties, inheritance, and documentation

## 🔧 Customization

### Adding New API Classes

1. Update `data/links.log` with new API name and URL
2. Update `data/api_class_info.json` with class details
3. Update `data/pdf_text_mapping.json` with coordinates

### Modifying Dot Positions

Edit the positioning logic in `index.html`:
```javascript
const dotX = mapping.x - 77;  // Horizontal offset
const dotY = mapping.y + 5;   // Vertical offset
```

### Styling Changes

Modify the CSS in `index.html` to customize:
- Dot appearance and hover effects
- Tooltip styling
- Overall page design

## 🐛 Troubleshooting

### Common Issues

1. **Dots not appearing**: Check that `pdf_text_mapping.json` contains valid coordinates
2. **Tooltips not working**: Verify `api_class_info.json` contains the API class data
3. **Links not working**: Ensure `links.log` has correct API names and URLs
4. **SVG not loading**: Check that `assets/path12046.svg` exists and is accessible

### Debug Mode

For development, you can add console logging by uncommenting the console.log statements in the JavaScript code.

## 📈 Performance

- **Initial Load**: ~2-3 seconds (depending on network)
- **Interactive Response**: <100ms
- **File Sizes**:
  - SVG: ~500KB
  - JSON data: ~2MB total
  - HTML: ~50KB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Autodesk for the Fusion 360 API documentation
- Fusion 360 community for feedback and suggestions
- Open source contributors

## 📞 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact the maintainer
- Check the documentation

---

**Last Updated**: July 2025
**Version**: 1.0.0 