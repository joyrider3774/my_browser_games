# Joyrider377's Browser Stuff
This is a modified Microbox "app" to show my html related games and so from any page on the internet inside Microbox and not just microStudio games. 

I modified the microBox app to be able to add it as a frontend to a repository of browser games i made on my github (see [here](https://joyrider3774.github.io/my_browser_games/)). 

## Changes i did:

* added system to load any url (game) in the iframe
* added extra fields like itemtype (game, demo, ...) and engine (wasm4, playdate, arduboy, microstudio, ...) 
* added sorting options for the new fields
* increased z-index of the exit button image to 9999999 as wasm4 games set the window (iframe's) z-index to 999999
* added "fullscreen 'none'" to allow property of iframe, to disallow pages inside the iframe going fullscreen and obscuring the exit image. By default same domain page can go fullscreen, adding none prevents this as well.
* searched for the frame using document.getElementByID in the setTimeout functions as i was getting errors in the javascript console when using the iFrame variable starting from the 2nd time i launched something. (did not test to see if original microbox had same issue)
* added an onmessage handler that goes together with a little script to notify microbox the game has started and so/

## Loading from different urls

The loading from a different url can be made to work with any html based game if you add the html script code seen below. It works by using postmessage calls and an onmessage handler between the iframe and parent window to detect a game being started or quit using ESC key or Menu button on gamepad without it the screen remained black when using non microStudio urls
The script also makes use of a [javascript class](https://github.com/alvaromontoro/gamecontroller.js/blob/master/dist/gamecontroller.min.js) to handle game input so all my game (pages) can quit also when the menu button on the gamepad is pressed.

this is the script that you need to add to your games html pages:

```
<script>
    if(window.parent)
    {
      window.document.addEventListener('keydown', (event) => {
        if(event.key == "Escape")
        {
          console.log('sended quit');
          window.parent.postMessage(JSON.stringify({name:"quit"}), "*");
        }
      });
      
      window.addEventListener('load', (event) => {
        console.log('sended start');
        window.parent.postMessage(JSON.stringify({name: "start"}), "*");
      });
    }
</script>
<script src="./gamecontroller.min.js" >
      gameControl.on('connect', function(gamepad) {
        gamepad.before('start', function() {
          console.log('sended gamepad quit');
          window.parent.postMessage(JSON.stringify({name:"quit"}), "*");
        });
      });
</script>

```

## Credits
This wouldn't have been possible without the [original microbox code](https://microstudio.dev/i/gilles/microbox/) from Gilles and now i have a neat frontend for my html web stuff :)
I also thank [alvarmontoro](https://github.com/alvaromontoro) for his gamecontroller javascript. I also made use of multiple sites to look up properties and javascript functions and 
found helpfull things on stackoverflow, mozilla developper site and w3schools