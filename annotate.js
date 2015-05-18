document.addEventListener('DOMContentLoaded', function() {
    // Reference to the image canvas.
    window.canvas = document.getElementById('image-canvas');

    // The current working image.
    window.currentImage = null;

    // The arrows drawn on the image.
    window.arrows = [];
    
    // Set up paste handler.
    document.onpaste = function(event) {
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;

        if (items[0].type.indexOf('image') !== 0) {
            alert('Paste an image, please');
            return;
        }
        
        var blob = items[0].getAsFile();
        var reader = new FileReader();
        
        reader.onload = function(event) {
            var imageDataURI = event.target.result;
            var image = new Image();
            
            image.onload = function() {
                // Resize the canvas to match the image.
                canvas.height = '' + image.height;
                canvas.width = '' + image.width;

                window.currentImage = image;

                // Trigger a redraw.
                redraw();
            }
            image.src = imageDataURI;
        }; 
        
        reader.readAsDataURL(blob);
    };

    // Set up undo button and keyboard shortcut.
    function undo() {
        window.arrows.pop();
    }
    document.getElementById('undo-button').onclick = undo;
    Mousetrap.bind('mod+z', undo);

    // Set up drag handlers.
    window.mouseDown = false;
    canvas.addEventListener('mousedown', function(event) {
        window.mouseDown = true;

        window.arrows.push(new Arrow(event.layerX, event.layerY, event.layerX, event.layerY));
    });

    canvas.addEventListener('mousemove', function(event) {
        if (window.mouseDown && window.arrows.length > 0) {
            window.arrows[window.arrows.length - 1].setEnd(event.layerX, event.layerY);
        }
    });

    canvas.addEventListener('mouseup', function(event) {
        window.mouseDown = false;
        
        if (window.arrows.length > 0) {
            window.arrows[window.arrows.length - 1].setEnd(event.layerX, event.layerY);
        }
    });

    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame 
    requestAnimationFrame(redraw);

    function redraw() {
        // Trigger another redraw later.
        requestAnimationFrame(redraw);
        
        if (!window.currentImage) {
            return;
        }

        var context = canvas.getContext('2d');

        // Clear the canvas.
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the current working image.
        context.drawImage(window.currentImage, 0, 0);
        
        // Draw the arrows.
        window.arrows.forEach(function(arrow) {
            arrow.render(context);
        });
    }
});

function Arrow(beginX, beginY, endX, endY) {
    this.begin = {
        x: beginX,
        y: beginY
    };

    this.setBegin = function(newX, newY) {
        this.begin.x = newX;
        this.begin.y = newY;
    };

    this.end = {
        x: endX,
        y: endY
    };

    this.setEnd = function(newX, newY) {
        this.end.x = newX;
        this.end.y = newY;
    };

    this.render = function(context) {
        var arrowColor = 'red';
        context.strokeStyle = arrowColor;
        context.fillStyle = arrowColor;
        context.lineWidth = 2;
        context.lineCap = 'butt';

        // Draw the line of the arrow.
        context.beginPath();

        context.moveTo(this.begin.x, this.begin.y);
        context.lineTo(this.end.x, this.end.y);

        context.stroke();

        // Draw the head of the arrow.
        var arrowHeadBaseHalfLength = 15;
        var arrowHeadHeight = 30;

        var deltaX = this.end.x - this.begin.x;
        var deltaY = this.end.y - this.begin.y;
        var lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        var baseX = this.end.x - deltaX * arrowHeadHeight / lineLength;
        var baseY = this.end.y - deltaY * arrowHeadHeight / lineLength;

        var rightCornerPoint = {
            x: baseX + deltaY * arrowHeadBaseHalfLength / lineLength,
            y: baseY - deltaX * arrowHeadBaseHalfLength / lineLength
        };
        var leftCornerPoint = {
            x: baseX - deltaY * arrowHeadBaseHalfLength / lineLength,
            y: baseY + deltaX * arrowHeadBaseHalfLength / lineLength
        };

        context.beginPath();

        var angle = Math.atan2(this.end.y - this.begin.y, this.end.x - this.begin.x);
        context.moveTo(this.begin.x, this.begin.y);
        context.lineTo(this.end.x, this.end.y);
        context.lineTo(this.end.x - arrowHeadHeight * Math.cos(angle - Math.PI / 6),
                       this.end.y - arrowHeadHeight * Math.sin(angle - Math.PI / 6));
        context.moveTo(this.end.x, this.end.y);
        context.lineTo(this.end.x - arrowHeadHeight * Math.cos(angle + Math.PI / 6),
                       this.end.y - arrowHeadHeight * Math.sin(angle + Math.PI / 6));

        
        
        // context.moveTo(this.end.x, this.end.y);
        // context.lineTo(rightCornerPoint.x, rightCornerPoint.y);
        // context.lineTo(leftCornerPoint.x, leftCornerPoint.y);
        
        context.stroke();
    };
}
