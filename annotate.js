document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('image-canvas');
    window.currentImage = null;

    window.arrowBegin = null;
    window.arrowEnd = null;
    
    // Set up paste handler.
    document.onpaste = function(event) {
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;

        if (items[0].type.indexOf('image') !== 0) {
            alert('Paste an *image*, dummy');
            return;
        }
        
        var blob = items[0].getAsFile();
        var reader = new FileReader();
        
        reader.onload = function(event) {
            var imageDataURI = event.target.result;
            var image = new Image();
            
            image.onload = function() {
                // Resize the canvas.
                canvas.height = '' + image.height;
                canvas.width = '' + image.width;

                var context = canvas.getContext('2d');
                
                context.drawImage(image, 0, 0);

                window.currentImage = image;
            }
            image.src = imageDataURI;
        }; 
        
        reader.readAsDataURL(blob);
    };

    // Set up drag handlers.
    window.tracking = false;
    canvas.addEventListener('mousedown', function(event) {
        window.tracking = true;
        
        window.arrowBegin = {
            x: event.layerX,
            y: event.layerY
        };
        window.arrowEnd = {
            x: event.layerX,
            y: event.layerY
        };
    });

    canvas.addEventListener('mousemove', function(event) {
        if (window.tracking) {
            window.arrowEnd = {
                x: event.layerX,
                y: event.layerY
            };
        }
    });

    canvas.addEventListener('mouseup', function(event) {
        window.tracking = false;
        
        window.arrowEnd = {
            x: event.layerX,
            y: event.layerY
        };
    });

    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame 
    requestAnimationFrame(redraw);

    function redraw() {
        requestAnimationFrame(redraw);
        
        if (!window.currentImage) {
            return;
        }

        var context = canvas.getContext('2d');
                
        context.drawImage(window.currentImage, 0, 0);

        if (window.arrowBegin) {
            context.strokeStyle = 'red';
            context.fillStyle = 'red';
            context.lineWidth = 5;
            
            context.beginPath();
            
            context.moveTo(window.arrowBegin.x, window.arrowBegin.y);
            context.lineTo(window.arrowEnd.x, window.arrowEnd.y);

            context.closePath();
            context.stroke();
        }
    }
});
