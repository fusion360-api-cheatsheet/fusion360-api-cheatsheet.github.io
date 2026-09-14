// Global variables
const ASSET_VERSION = 'v1';
let currentZoom = 1;
let apiLinks = {};
let pdfMapping = {}; // PDF-based text mapping
let apiClassInfo = {}; // API class information for hover tooltips
let totalElements = 0;
let loadedElements = 0;

// Load the API links from the log file
async function loadApiLinks() {
  try {
    const response = await fetch('data/links.log?v=' + ASSET_VERSION);
    const text = await response.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes(' -> ')) {
        const parts = line.split(' -> ');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const url = parts[1].trim();
          if (name && url && !name.startsWith('http')) {
            apiLinks[name] = url;
          }
        }
      }
    }
    totalElements = Object.keys(apiLinks).length;
    document.getElementById('totalElements').textContent = totalElements;
    document.getElementById('stats').textContent = `Loaded ${totalElements} API elements`;
  } catch (error) {
    console.error('Error loading API links:', error);
    document.getElementById('stats').textContent = 'Error loading API links';
  }
}

// Load the PDF-based text mapping
async function loadPdfMapping() {
  try {
    const response = await fetch('data/pdf_text_mapping.json?v=' + ASSET_VERSION);
    const data = await response.json();
    data.api_text_blocks.forEach(block => {
      pdfMapping[block.text] = {
        api_name: block.api_name,
        x: block.x,
        y: block.y,
        bbox: block.bbox
      };
    });
  } catch (error) {
    console.error('Error loading PDF mapping:', error);
  }
}

// Load API class information for hover tooltips
async function loadApiClassInfo() {
  try {
    const response = await fetch('data/api_class_info.json?v=' + ASSET_VERSION);
    const data = await response.json();
    apiClassInfo = data;
  } catch (error) {
    console.error('Error loading API class info:', error);
    apiClassInfo = {
      Application: {
        name: 'Application',
        inheritance: 'Base',
        methods: ['activeDocument', 'documents', 'userInterface', 'version'],
        properties: ['activeDocument', 'documents', 'userInterface'],
        docstring: 'The Application object is the root object for accessing all other objects in the Fusion 360 API.',
        method_count: 4,
        property_count: 3
      },
      Design: {
        name: 'Design',
        inheritance: 'Base',
        methods: ['rootComponent', 'activeComponent', 'designType'],
        properties: ['rootComponent', 'activeComponent', 'designType'],
        docstring: 'Represents a design document containing components, features, and other design elements.',
        method_count: 3,
        property_count: 3
      }
    };
  }
}

// Tooltip class
class TooltipMenu {
  constructor(dot, apiName, mapping, isPinned = false) {
    this.dot = dot;
    this.apiName = apiName;
    this.mapping = mapping;
    this.isPinned = isPinned;
    this.isDragging = false;
    this.xOffset = 0;
    this.yOffset = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.hoverTimeout = null;
    this.tooltipElement = this.createTooltipElement();
    this.populateTooltipData();
    this.initEvents();
  }

  createTooltipElement() {
    const tooltip = document.createElement('div');
    tooltip.classList.add('hover-tooltip');
    if (this.isPinned) {
      tooltip.classList.add('pinned');
    }
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <h3 id="tooltipTitle">${this.apiName}</h3>
        <div class="tooltip-actions">
          <a id="tooltipSourceLink" href="#" target="_blank" rel="noopener noreferrer" class="tooltip-link source-link">📄 View Source</a>
          <button class="tooltip-close">×</button>
        </div>
      </div>
      <div class="class-info">
        <div class="inheritance" id="tooltipInheritance">Loading...</div>
        <div class="file-info" id="tooltipFileInfo">Loading...</div>
        <div class="docstring" id="tooltipDocstring">Loading...</div>
      </div>
      <div class="methods">
        <h4>Methods (<span id="tooltipMethodCount">0</span>)</h4>
        <div class="method-list" id="tooltipMethods"></div>
      </div>
      <div class="properties">
        <h4>Properties (<span id="tooltipPropertyCount">0</span>)</h4>
        <div class="property-list" id="tooltipProperties"></div>
      </div>
      <div class="documentation">
        <h4>Documentation</h4>
        <a id="tooltipDocLink" href="work-in-progress.html" target="_blank" rel="noopener noreferrer" class="tooltip-link">📖 View Official Documentation</a>
      </div>
      <div class="sample-usage">
        <h4>Sample Usage</h4>
        <code id="tooltipSampleCode" class="tooltip-code">import adsk.core<br>app = adsk.core.Application.get()</code>
      </div>
      <div class="stats">
        <div>Methods: <span id="tooltipMethodStats">0</span> | Properties: <span id="tooltipPropertyStats">0</span></div>
      </div>
      <div class="resize-handle"></div>
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  initEvents() {
    // Store bound event handlers for proper cleanup
    this.boundCloseTooltip = () => this.closeTooltip();
    this.boundDragStart = (event) => this.dragStart(event);
    this.boundDrag = (event) => this.drag(event);
    this.boundDragEnd = () => this.dragEnd();
    this.boundMouseEnter = () => {
      if (!this.isPinned) {
        this.dot.setAttribute('r', '3.3');
        this.showTooltip();
      }
    };
    this.boundMouseLeave = () => {
      if (!this.isPinned) {
        this.dot.setAttribute('r', '3');
        this.hoverTimeout = setTimeout(() => this.removeTooltip(), 300);
      }
    };

    this.tooltipElement.querySelector('.tooltip-close').addEventListener('click', this.boundCloseTooltip);
    this.tooltipElement.addEventListener('mousedown', this.boundDragStart);
    document.addEventListener('mousemove', this.boundDrag);
    document.addEventListener('mouseup', this.boundDragEnd);
    this.dot.addEventListener('mouseenter', this.boundMouseEnter);
    this.dot.addEventListener('mouseleave', this.boundMouseLeave);
    this.initResize();
  }

  initResize() {
    const resizeHandle = this.tooltipElement.querySelector('.resize-handle');
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    // Store resize handlers for cleanup
    this.resizeHandlers = {
      doDrag: (e) => {
        if (isResizing) {
          this.tooltipElement.style.width = (startWidth + e.clientX - startX) + 'px';
          this.tooltipElement.style.height = (startHeight + e.clientY - startY) + 'px';
        }
      },
      stopDrag: () => {
        isResizing = false;
        document.documentElement.removeEventListener('mousemove', this.resizeHandlers.doDrag, false);
        document.documentElement.removeEventListener('mouseup', this.resizeHandlers.stopDrag, false);
      }
    };

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView.getComputedStyle(this.tooltipElement).width, 10);
      startHeight = parseInt(document.defaultView.getComputedStyle(this.tooltipElement).height, 10);
      document.documentElement.addEventListener('mousemove', this.resizeHandlers.doDrag, false);
      document.documentElement.addEventListener('mouseup', this.resizeHandlers.stopDrag, false);
    });
  }

  pin() {
    this.isPinned = true;
    this.dot.classList.add('pinned');
    this.dot.setAttribute('r', '9');
    this.tooltipElement.classList.add('pinned');
    this.showTooltip();
  }

  unpin() {
    this.isPinned = false;
    this.dot.classList.remove('pinned');
    this.dot.setAttribute('r', '3');
    this.tooltipElement.classList.remove('pinned');
  }

  showTooltip() {
    const rect = this.dot.getBoundingClientRect();
    this.tooltipElement.style.left = `${rect.left + window.scrollX + 10}px`;
    this.tooltipElement.style.top = `${rect.top + window.scrollY + 10}px`;
    this.tooltipElement.classList.add('show');
  }

  removeTooltip() {
    if (!this.isPinned) {
      this.cleanup();
      this.tooltipElement.remove();
    }
  }

  closeTooltip() {
    this.unpin();
    this.cleanup();
    this.tooltipElement.remove();
    this.dot.classList.remove('pinned');
    this.dot.classList.remove('hover');
    this.dot.setAttribute('r', '3');
  }

  cleanup() {
    // Clear hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Remove document-level event listeners
    if (this.boundDrag) {
      document.removeEventListener('mousemove', this.boundDrag);
    }
    if (this.boundDragEnd) {
      document.removeEventListener('mouseup', this.boundDragEnd);
    }

    // Remove tooltip element event listeners
    if (this.tooltipElement && this.boundCloseTooltip) {
      this.tooltipElement.querySelector('.tooltip-close')?.removeEventListener('click', this.boundCloseTooltip);
      this.tooltipElement.removeEventListener('mousedown', this.boundDragStart);
    }

    // Remove dot event listeners
    if (this.dot && this.boundMouseEnter) {
      this.dot.removeEventListener('mouseenter', this.boundMouseEnter);
      this.dot.removeEventListener('mouseleave', this.boundMouseLeave);
    }

    // Clean up resize event listeners
    this.cleanupResize();
  }

  cleanupResize() {
    // Remove resize event listeners if they exist
    if (this.resizeHandlers) {
      document.documentElement.removeEventListener('mousemove', this.resizeHandlers.doDrag);
      document.documentElement.removeEventListener('mouseup', this.resizeHandlers.stopDrag);
      this.resizeHandlers = null;
    }
  }

  dragStart(event) {
    if (event.target.classList.contains('tooltip-close') || event.target.closest('.tooltip-link')) {
      return;
    }
    event.stopPropagation();
    this.initialX = event.clientX - this.xOffset;
    this.initialY = event.clientY - this.yOffset;
    if (event.target === this.tooltipElement || this.tooltipElement.contains(event.target)) {
      this.isDragging = true;
      this.tooltipElement.setAttribute('data-dragging', 'true');
    }
  }

  drag(event) {
    if (this.isDragging) {
      event.preventDefault();
      this.currentX = event.clientX - this.initialX;
      this.currentY = event.clientY - this.initialY;
      this.xOffset = this.currentX;
      this.yOffset = this.currentY;
      this.setTranslate(this.currentX, this.currentY);
    }
  }

  dragEnd() {
    this.initialX = this.currentX;
    this.initialY = this.currentY;
    this.isDragging = false;
    this.tooltipElement.setAttribute('data-dragging', 'false');
  }

  setTranslate(xPos, yPos) {
    this.tooltipElement.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  populateTooltipData() {
    const classInfo = apiClassInfo[this.apiName];
    if (classInfo) {
      const inheritanceElement = this.tooltipElement.querySelector('#tooltipInheritance');
      inheritanceElement.textContent = `Inherits from: ${classInfo.inheritance || 'None'}`;
      const fileInfoElement = this.tooltipElement.querySelector('#tooltipFileInfo');
      const filePath = classInfo.file || 'N/A';
      const lineNumber = classInfo.line || 'N/A';
      fileInfoElement.innerHTML = `Source: <span class="file-path">${filePath}</span> (line ${lineNumber})`;
      const docstringElement = this.tooltipElement.querySelector('#tooltipDocstring');
      docstringElement.textContent = classInfo.docstring || 'No description available.';
      const methodCountElement = this.tooltipElement.querySelector('#tooltipMethodCount');
      const methodStatsElement = this.tooltipElement.querySelector('#tooltipMethodStats');
      const methodsElement = this.tooltipElement.querySelector('#tooltipMethods');
      if (classInfo.methods && classInfo.methods.length > 0) {
        methodCountElement.textContent = classInfo.methods.length;
        methodStatsElement.textContent = classInfo.methods.length;
        methodsElement.innerHTML = classInfo.methods.map(method => {
          const methodDoc = method.docstring ? `<div class="method-doc">${method.docstring}</div>` : '';
          const methodLine = method.line ? ` (line ${method.line})` : '';
          return `
            <div class="method-item">
              <div class="method-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="method-name">• ${method.name}</span>
                <span class="toggle-icon">▶</span>
                <a href="#" class="method-source-link" data-file="${classInfo.file}" data-line="${method.line}" data-pattern="def ${method.name}" onclick="event.stopPropagation()">📄</a>
              </div>
              <div class="method-details">
                <div class="method-signature">${method.signature}</div>
                ${methodDoc}
                <div class="method-line">${methodLine}</div>
              </div>
            </div>`;
        }).join('');
      } else {
        methodCountElement.textContent = '0';
        methodStatsElement.textContent = '0';
        methodsElement.innerHTML = '<div class="method-item">No methods available</div>';
      }
      const propertyCountElement = this.tooltipElement.querySelector('#tooltipPropertyCount');
      const propertyStatsElement = this.tooltipElement.querySelector('#tooltipPropertyStats');
      const propertiesElement = this.tooltipElement.querySelector('#tooltipProperties');
      if (classInfo.properties && classInfo.properties.length > 0) {
        propertyCountElement.textContent = classInfo.properties.length;
        propertyStatsElement.textContent = classInfo.properties.length;
        propertiesElement.innerHTML = classInfo.properties.map(property => {
          const propertyDoc = property.docstring ? `<div class="property-doc">${property.docstring}</div>` : '';
          const propertyLine = property.line ? ` (line ${property.line})` : '';
          return `
            <div class="property-item">
              <div class="property-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="property-name">• ${property.name}</span>
                <span class="toggle-icon">▶</span>
                <a href="#" class="property-source-link" data-file="${classInfo.file}" data-line="${property.line}" data-pattern="@property\\s*\\ndef ${property.name}" onclick="event.stopPropagation()">📄</a>
              </div>
              <div class="property-details">
                ${propertyDoc}
                <div class="property-line">${propertyLine}</div>
              </div>
            </div>`;
        }).join('');
      } else {
        propertyCountElement.textContent = '0';
        propertyStatsElement.textContent = '0';
        propertiesElement.innerHTML = '<div class="property-item">No properties available</div>';
      }
      const sourceLinkElement = this.tooltipElement.querySelector('#tooltipSourceLink');
      if (classInfo.file && classInfo.line) {
        sourceLinkElement.href = `assets/${classInfo.file}#L${classInfo.line}`;
        sourceLinkElement.onclick = (e) => {
          e.preventDefault();
          this.navigateToSource(classInfo.file, classInfo.line, `class ${this.apiName}`);
        };
      } else {
        sourceLinkElement.href = '#';
        sourceLinkElement.style.opacity = '0.5';
        sourceLinkElement.textContent = '📄 Source not available';
      }
    } else {
      this.tooltipElement.querySelector('#tooltipInheritance').textContent = 'Information not available';
      this.tooltipElement.querySelector('#tooltipFileInfo').textContent = 'Source: N/A';
      this.tooltipElement.querySelector('#tooltipDocstring').textContent = 'No description available for this API class.';
      this.tooltipElement.querySelector('#tooltipMethodCount').textContent = '0';
      this.tooltipElement.querySelector('#tooltipPropertyCount').textContent = '0';
      this.tooltipElement.querySelector('#tooltipMethods').innerHTML = '<div class="method-item">No methods available</div>';
      this.tooltipElement.querySelector('#tooltipProperties').innerHTML = '<div class="property-item">No properties available</div>';
    }
    const docLinkElement = this.tooltipElement.querySelector('#tooltipDocLink');
    docLinkElement.href = 'work-in-progress.html';
    docLinkElement.textContent = '📖 View Official Documentation';
    this.addSourceLinkListeners();
  }

  navigateToSource(filePath, lineNumber, searchPattern) {
    const sourceUrl = `assets/${filePath}`;
    if (lineNumber && lineNumber !== 'N/A') {
      const lineUrl = `${sourceUrl}#L${lineNumber}`;
      window.open(lineUrl, '_blank');
      return;
    }
    window.open(sourceUrl, '_blank');
    console.log(`Search pattern for ${filePath}: ${searchPattern}`);
  }

  addSourceLinkListeners() {
    this.tooltipElement.querySelectorAll('.method-source-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const file = link.dataset.file;
        const line = link.dataset.line;
        const pattern = link.dataset.pattern;
        this.navigateToSource(file, line, pattern);
      });
    });
    this.tooltipElement.querySelectorAll('.property-source-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const file = link.dataset.file;
        const line = link.dataset.line;
        const pattern = link.dataset.pattern;
        this.navigateToSource(file, line, pattern);
      });
    });
  }
}

// Load the SVG and add interactive dots based on PDF mapping
async function loadSVG() {
  try {
    const response = await fetch('assets/path12046.svg?v=' + ASSET_VERSION);
    const svgText = await response.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgText;
    const svg = tempDiv.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', 'auto');
      svg.style.maxWidth = '100%';
      let loadedElements = 0;
      const totalElements = Object.keys(apiLinks).length;
      Object.entries(pdfMapping).forEach(([text, mapping]) => {
        if (apiLinks[mapping.api_name]) {
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          const dotX = mapping.x - 77;
          const dotY = mapping.y - 67;
          dot.setAttribute('cx', dotX.toString());
          dot.setAttribute('cy', dotY.toString());
          dot.setAttribute('r', '3');
          dot.setAttribute('class', 'api-dot');
          dot.setAttribute('data-api-name', mapping.api_name);
          dot.setAttribute('data-text', text);
          dot._tooltipMenu = null;
          dot.addEventListener('mouseenter', () => {
            dot.classList.add('hover');
            if (!dot._tooltipMenu) {
              dot._tooltipMenu = new TooltipMenu(dot, mapping.api_name, mapping, false);
              dot._tooltipMenu.showTooltip();
            } else if (!dot._tooltipMenu.isPinned) {
              dot._tooltipMenu.showTooltip();
            }
          });
          dot.addEventListener('mouseleave', () => {
            if (dot.classList.contains('pinned')) {
              return;
            }
            dot.classList.remove('hover');
            if (dot._tooltipMenu && !dot._tooltipMenu.isPinned) {
              dot._tooltipMenu.removeTooltip();
              dot._tooltipMenu = null;
            }
          });
          dot.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dot._tooltipMenu) {
              if (!dot._tooltipMenu.isPinned) {
                dot._tooltipMenu.pin();
              } else {
                dot._tooltipMenu.unpin();
                dot._tooltipMenu.closeTooltip();
                dot._tooltipMenu = null;
              }
            } else {
              dot._tooltipMenu = new TooltipMenu(dot, mapping.api_name, mapping, true);
              dot._tooltipMenu.pin();
            }
          });
          svg.appendChild(dot);
          loadedElements++;
        }
      });
      document.getElementById('svgContainer').innerHTML = '';
      document.getElementById('svgContainer').appendChild(svg);
      document.getElementById('stats').innerHTML = `<span class="stats-clickable" onclick="toggleStats()">Loaded ${totalElements} API elements • ${loadedElements} interactive dots created</span>`;
    }
  } catch (error) {
    console.error('Error loading SVG:', error);
    document.getElementById('svgContainer').innerHTML = '<div class="loading">Error loading SVG file. Please ensure assets/path12046.svg is available.</div>';
  }
}

// Autocomplete search functionality
function setupSearch() {
  const searchBox = document.getElementById('searchBox');
  const autocompleteDropdown = document.getElementById('autocompleteDropdown');
  let selectedIndex = -1;
  let filteredItems = [];
  function getApiClassNames() {
    const dots = document.querySelectorAll('svg circle.api-dot');
    const availableClasses = Array.from(dots).map(dot => dot.getAttribute('data-api-name')).filter(Boolean);
    return availableClasses.sort();
  }
  function filterApiClasses(searchTerm) {
    if (!searchTerm.trim()) {
      return [];
    }
    const searchLower = searchTerm.toLowerCase();
    const apiClasses = getApiClassNames();
    const startsWithMatches = apiClasses.filter(className => className.toLowerCase().startsWith(searchLower));
    const containsMatches = apiClasses.filter(className => className.toLowerCase().includes(searchLower) && !className.toLowerCase().startsWith(searchLower));
    return [...startsWithMatches, ...containsMatches].slice(0, 10);
  }
  function createAutocompleteItems(items) {
    if (items.length === 0) {
      return '<div class="no-results">No API classes found</div>';
    }
    return items.map((className, index) => {
      const isSelected = index === selectedIndex;
      const classInfo = apiClassInfo[className] || {};
      const type = classInfo.inheritance || 'Class';
      return `
        <div class="autocomplete-item ${isSelected ? 'selected' : ''}" data-api-name="${className}" data-index="${index}">
          <span class="api-name">${className}</span>
          <span class="api-type">${type}</span>
        </div>`;
    }).join('');
  }
  function showAutocomplete(items) {
    if (items.length === 0) {
      hideAutocomplete();
      return;
    }
    autocompleteDropdown.innerHTML = createAutocompleteItems(items);
    autocompleteDropdown.classList.add('show');
  }
  function hideAutocomplete() {
    autocompleteDropdown.classList.remove('show');
    selectedIndex = -1;
  }
  function navigateToApiClass(className) {
    let dot = document.querySelector(`svg circle.api-dot[data-api-name="${className}"]`);
    if (dot) {
      dot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        dot.dispatchEvent(clickEvent);
      }, 500);
    }
  }
  searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const svg = document.querySelector('svg');
    if (!svg) return;
    filteredItems = filterApiClasses(searchTerm);
    selectedIndex = -1;
    if (searchTerm.trim()) {
      showAutocomplete(filteredItems);
    } else {
      hideAutocomplete();
    }
  });
  searchBox.addEventListener('keydown', (e) => {
    if (!autocompleteDropdown.classList.contains('show')) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
        autocompleteDropdown.innerHTML = createAutocompleteItems(filteredItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        autocompleteDropdown.innerHTML = createAutocompleteItems(filteredItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
          const selectedClass = filteredItems[selectedIndex];
          searchBox.value = selectedClass;
          hideAutocomplete();
          navigateToApiClass(selectedClass);
        } else if (filteredItems.length === 1) {
          const selectedClass = filteredItems[0];
          searchBox.value = selectedClass;
          hideAutocomplete();
          navigateToApiClass(selectedClass);
        }
        break;
      case 'Escape':
        hideAutocomplete();
        searchBox.blur();
        break;
    }
  });
  autocompleteDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      const className = item.dataset.apiName;
      searchBox.value = className;
      hideAutocomplete();
      navigateToApiClass(className);
    }
  });
  document.addEventListener('click', (e) => {
    if (!searchBox.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      hideAutocomplete();
    }
  });
  searchBox.addEventListener('focus', () => {
    if (searchBox.value.trim() && filteredItems.length > 0) {
      showAutocomplete(filteredItems);
    }
  });
}

// Zoom
function zoomIn() { currentZoom = Math.min(currentZoom * 1.2, 3); applyZoom(); }
function zoomOut() { currentZoom = Math.max(currentZoom / 1.2, 0.3); applyZoom(); }
function resetZoom() { currentZoom = 1; applyZoom(); }
function applyZoom() {
  const svg = document.querySelector('svg');
  if (svg) {
    svg.style.transform = `scale(${currentZoom})`;
    svg.style.transformOrigin = 'top left';
  }
}

// Panels
function toggleInfo() {
  const panel = document.getElementById('infoPanel');
  panel.classList.toggle('show');
}
function toggleStats() {
  const panel = document.getElementById('statsPanel');
  panel.classList.toggle('show');
  if (panel.classList.contains('show')) {
    populateStatsPanel();
  }
}
function switchTab(e, tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  if (e && e.target) { e.target.classList.add('active'); }
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.getElementById(tabName + 'Tab').classList.add('active');
}

function populateStatsPanel() {
  const allApiElements = Object.keys(apiLinks);
  const elementsWithDots = Object.values(pdfMapping).map(mapping => mapping.api_name);
  const missingElements = allApiElements.filter(element => !elementsWithDots.includes(element));
  document.getElementById('statsTotalElements').textContent = allApiElements.length;
  document.getElementById('statsLoadedElements').textContent = elementsWithDots.length;
  document.getElementById('statsMissingElements').textContent = missingElements.length;
  const missingList = document.getElementById('missingElementsList');
  missingList.innerHTML = missingElements.length > 0 
    ? missingElements.map(element => {
        const docLink = apiLinks[element];
        return `<div class="element-item missing"><a href="${docLink}" target="_blank" class="element-link doc-link" title="View Documentation">📖 ${element}</a></div>`;
      }).join('')
    : '<div class="element-item">No missing elements found!</div>';
  const loadedList = document.getElementById('loadedElementsList');
  loadedList.innerHTML = elementsWithDots.length > 0
    ? elementsWithDots.map(element => {
        return `<div class="element-item loaded"><a href="#" onclick="navigateToElement('${element}'); return false;" class="element-link svg-link" title="Navigate to Element">🔍 ${element}</a></div>`;
      }).join('')
    : '<div class="element-item">No loaded elements found!</div>';
}

function navigateToElement(elementName) {
  let dot = document.querySelector(`[data-api-name="${elementName}"]`);
  if (!dot) {
    const allDots = document.querySelectorAll('.api-dot');
    dot = Array.from(allDots).find(d => d.getAttribute('data-text') === elementName);
  }
  if (dot) {
    dot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      dot.dispatchEvent(clickEvent);
    }, 500);
  }
}

// Init
async function init() {
  await Promise.all([loadApiLinks(), loadPdfMapping(), loadApiClassInfo()]);
  await loadSVG();
  setupSearch();
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case '=':
        case '+': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
        case '0': e.preventDefault(); resetZoom(); break;
      }
    }
  });
}

init();


