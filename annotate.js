/*globals FileReader, Image, Mousetrap*/

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  // Currently only works in Chrome, so check for that first.
  if (window.navigator.userAgent.indexOf('Chrome') === -1) {
    document.getElementById('paste-image-text').innerHTML = 'Currently this page only works in Chrome. <br><span style="font-size: 20px">I know, I know... it\'s on my todo list.</span>';
    return;
  }

  function readFile(file) {
    var reader = new FileReader();

    reader.onload = function(event) {
      var imageDataURI = event.target.result;
      var image = new Image();

      image.onload = function() {
        // Resize the canvas to match the image.
        window.canvas.height = '' + image.height;
        window.canvas.width = '' + image.width;

        document.getElementById('canvas-container').style.width = image.width + 'px';

        window.currentImage = image;

        // Trigger a redraw.
        redraw();

        showControls();
      };
      image.src = imageDataURI;
    };

    reader.readAsDataURL(file);
  }


  // Reference to the image canvas.
  window.canvas = document.getElementById('image-canvas');

  // Drop handler
  var dropLayer = document.getElementById('drop-layer');

  document.ondrop = function(event) {
    event.preventDefault();
    readFile(event.dataTransfer.files[0]);
    dropLayer.style.display = 'none';
    return false;
  };

  document.ondragover = function(event) {
    event.preventDefault();
    event.stopPropagation();
    dropLayer.style.display = 'flex';
  };

  dropLayer.ondragleave = function(event) {
    event.preventDefault();
    event.stopPropagation();
    dropLayer.style.display = 'none';
  };

  // The current working image.
  window.currentImage = null;

  // The annotation objects drawn on the image.
  window.annotationObjects = [];

  // The currently selected annotation object type.
  window.currentAnnotationObjectType = 'arrow';

  // Set up paste handler.
  document.onpaste = function(event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;

    if (items[0].type.indexOf('image') !== 0) {
      alert('Paste an image, please');
      return;
    }

    readFile(items[0].getAsFile());
  };

  // Set up undo button and keyboard shortcut.
  function undo() {
    window.annotationObjects.pop();
  }
  document.getElementById('undo-button').onclick = undo;
  Mousetrap.bind('mod+z', undo);

  function render() {
    document.getElementById('render-container').style.display = 'block';

    var imgTag = document.createElement('img');
    imgTag.src = canvas.toDataURL('image/png');

    var imageOutputArea = document.getElementById('image-output');
    removeChildren(imageOutputArea);

    imageOutputArea.appendChild(imgTag);
  }
  document.getElementById('render-button').onclick = render;
  Mousetrap.bind('r', render);

  function hideRenderWindow() {
    document.getElementById('render-container').style.display = 'none';
  }
  Mousetrap.bind('escape', hideRenderWindow);

  function showControls() {
    document.getElementById('paste-image-text').style.display = 'none';

    Array.prototype.slice.call(document.querySelectorAll('.controls')).forEach(function(controlDiv) {
      controlDiv.style.display = 'block';
    });
  }

  function removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function deactivateAnnotationObjectButtons() {
    Array.prototype.slice.call(document.querySelectorAll('.annotation-object-button')).forEach(function(button) {
      button.classList.remove('active');
    });
  }

  // Set up annotation object type button handlers.
  function selectArrowType() {
    window.currentAnnotationObjectType = 'arrow';

    deactivateAnnotationObjectButtons();

    document.getElementById('arrow-button').classList.add('active');
  }
  document.getElementById('arrow-button').onclick = selectArrowType;
  Mousetrap.bind('a', selectArrowType);

  function selectBoxType() {
    window.currentAnnotationObjectType = 'box';

    deactivateAnnotationObjectButtons();

    document.getElementById('box-button').classList.add('active');
  }
  document.getElementById('box-button').onclick = selectBoxType;
  Mousetrap.bind('b', selectBoxType);

  function selectCircleType() {
    window.currentAnnotationObjectType = 'circle';

    deactivateAnnotationObjectButtons();

    document.getElementById('circle-button').classList.add('active');
  }
  document.getElementById('circle-button').onclick = selectCircleType;
  Mousetrap.bind('c', selectCircleType);

  function selectTextType() {
    window.currentAnnotationObjectType = 'text';

    deactivateAnnotationObjectButtons();

    document.getElementById('text-button').classList.add('active');
  }
  document.getElementById('text-button').onclick = selectTextType;
  Mousetrap.bind('t', selectTextType);

  // Set up drag handlers.
  window.mouseDown = false;
  window.canvas.addEventListener('mousedown', function(event) {
    window.mouseDown = true;

    var annotationObjectClass = {
      arrow: Arrow,
      box: Box,
      circle: Circle,
      text: Text
    }[window.currentAnnotationObjectType];
    var annotationObject = null;
    if (annotationObjectClass === Text) {
      var text = window.prompt("Enter text:", "");
      if (text !== null && text !== "")
        annotationObject = new Text(event.layerX, event.layerY, event.layerX, event.layerY, text);
    } else {
      annotationObject = new annotationObjectClass(event.layerX, event.layerY, event.layerX, event.layerY);
    }
    if (annotationObject !== null)
      window.annotationObjects.push(annotationObject);
  });

  window.canvas.addEventListener('mousemove', function(event) {
    if (window.mouseDown && window.annotationObjects.length > 0) {
      window.annotationObjects[window.annotationObjects.length - 1].setEnd(event.layerX, event.layerY);
    }
  });

  window.canvas.addEventListener('mouseup', function(event) {
    window.mouseDown = false;

    if (window.annotationObjects.length > 0) {
      window.annotationObjects[window.annotationObjects.length - 1].setEnd(event.layerX, event.layerY);
    }
  });

  var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
  requestAnimationFrame(redraw);
  function redraw() {
    requestAnimationFrame(redraw);

    if (!window.currentImage) {
      return;
    }

    var context = window.canvas.getContext('2d');

    // Clear the canvas.
    context.clearRect(0, 0, window.canvas.width, window.canvas.height);

    // Draw the current working image.
    context.drawImage(window.currentImage, 0, 0);

    // Draw the annotation objects.
    window.annotationObjects.forEach(function(annotationObject) {
      context.save();
      annotationObject.render(context);
      context.restore();
    });
  }
});

class AnnotationObject {
  constructor(beginX, beginY, endX, endY) {
    this.begin = {
      x: beginX,
      y: beginY
    };

    this.end = {
      x: endX,
      y: endY
    };
  }

  setBegin(newX, newY) {
    this.begin.x = newX;
    this.begin.y = newY;
  };

  setEnd(newX, newY) {
    this.end.x = newX;
    this.end.y = newY;
  };
}

class Arrow extends AnnotationObject {
  render(context) {
    var arrowColor = 'red';
    context.strokeStyle = arrowColor;
    context.fillStyle = arrowColor;
    context.lineWidth = 10;
    context.lineCap = 'round';

    var arrowHeadHeight = 30;

    context.beginPath();

    var angle = Math.atan2(this.end.y - this.begin.y, this.end.x - this.begin.x);

    // Draw the arrow body.
    context.moveTo(this.begin.x, this.begin.y);
    context.lineTo(this.end.x, this.end.y);

    // Draw one side of the arrow head.
    context.moveTo(this.end.x, this.end.y);
    context.lineTo(this.end.x - arrowHeadHeight * Math.cos(angle - Math.PI / 6),
                   this.end.y - arrowHeadHeight * Math.sin(angle - Math.PI / 6));

    // Draw the other side of the arrow head.
    context.moveTo(this.end.x, this.end.y);
    context.lineTo(this.end.x - arrowHeadHeight * Math.cos(angle + Math.PI / 6),
                   this.end.y - arrowHeadHeight * Math.sin(angle + Math.PI / 6));

    context.stroke();
  };
}

class Box extends AnnotationObject {
  height() {
    return this.end.y - this.begin.y;
  }

  width() {
    return this.end.x - this.begin.x;
  }

  render(context) {
    var boxColor = 'blue';
    context.strokeStyle = boxColor;
    context.fillStyle = boxColor;
    context.lineWidth = 10;
    context.lineCap = 'round';

    context.beginPath();

    context.moveTo(this.begin.x, this.begin.y);
    context.lineTo(this.begin.x + this.width(), this.begin.y);
    context.lineTo(this.begin.x + this.width(), this.begin.y + this.height());
    context.lineTo(this.begin.x, this.begin.y + this.height());
    context.lineTo(this.begin.x, this.begin.y);

    context.stroke();
  }
}

class Circle extends AnnotationObject {
  center() {
    return {
      x: this.begin.x,
      y: this.begin.y
    };
  }

  radius() {
    var dx = this.end.x - this.begin.x;
    var dy = this.end.y - this.begin.y;
    return Math.sqrt(dx * dx + dy * dy) / 2;
  }

  render(context) {
    var circleColor = 'green';
    context.strokeStyle = circleColor;
    context.fillStyle = circleColor;
    context.lineWidth = 10;
    context.lineCap = 'round';

    context.beginPath();

    var center = this.center();
    context.arc(center.x, center.y, this.radius(), 0, Math.PI * 2);

    context.stroke();
  }
}

class Text extends AnnotationObject {
  constructor(beginX, beginY, endX, endY, text) {
    super(beginX, beginY, endX, endY);
    this.text = text;
  }

  render(context) {
    context.font = '32px Arial';
    context.fillStyle = 'white';
    context.fillText(this.text, this.begin.x, this.begin.y);
    context.strokeStyle = 'black';
    context.strokeText(this.text, this.begin.x, this.begin.y);
  }
}
