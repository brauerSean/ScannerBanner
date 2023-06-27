

(function() {
    'use strict';

    var sbStyles = `

    button#bannerButton {
        display: none;
    }

    button#clearAll, .styleSaver {
        background-color: #30363d;
        color: white;
        border-radius: 5px;
        margin: 2px;
        z-index: 9999;

    }

    i[id^="delB-"] {
        color: #30363d;
        height: 16px;
        padding: 1px;
        z-index: 9999;
        position: relative;
        bottom: 8px;
        left: 15px;
    }

    i[id^="delB-"]:hover {
        color: red;
    }
    #sbContainer .bContainer {
        margin: 0px 0px 20px 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    #sbContainer .barcodeLabel {
        color: white;
        font-size: 20px;
        margin: 0px;
    }

    .barcode-svg {
        position: relative;
        right: 8px;
        border-radius: 2px;
    }

    #sbContainer {
        overflow: auto;
        height: 92vh;
        display: block;
        position: fixed;
        top: 0px;
        border-radius: 10px;
        padding: 2px;
        background-color: rgba(48, 54, 61, .7);
        z-index: 9997;
    }

    #sbContainer input[type="text"] {
        background-color: #30363d;
        color: white;
        width: 96%;
        border-radius: 5px;
        text-align: center;
        margin: 2px auto;
    }

    #keycodeContainer {
        display: flex;
        //flex-direction: row;
        justify-content: space-around;
        align-items: flex-start;
        position: fixed;
        bottom: 0;
        border-radius: 10px;
        width: 100%;
        z-index: 9998;
        background-color: rgba(48, 54, 61, .7);
    }
    .kclabels {
        color: white;
        font-family: Verdana;
        font-size: 12px;
        text-align: center;
    }
    .kc {
        margin: 0px 120px;
    }
    .flipSBL {
        left: 0;
    }
    .flipSBR {
        right: 0;
    }
    .flipKCL {
        flex-direction: row;
    }
    .flipKCR {
        flex-direction: row-reverse;

    }

    #mahlogah {
    }

    `
    GM_addStyle(sbStyles);
    GM_addStyle(`@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');`);


    const keys = GM_listValues();
/*
    //log keys:values for debugging
    function letsTest() {
    keys.forEach((key) => {
      const value = GM_getValue(key);
      console.log(`Key: ${key}, Value: ${value}`);
    });}
*/
    let barcodes = [];
    let bannerState = GM_getValue('canSeeBanner', 'block');
    let keycodesVisible = GM_getValue('canSeeKeycodes', 'flex');
    let blurState = [];
    let altNames = GM_getValue('nameChanges', {});
    let userSavedBarcodes = GM_getValue('userSB');
    let ddSide = GM_getValue('ddside') || 'flipSBL';
    let kcSide = GM_getValue('kcside') || 'flipKCL';
    let lastUsedSlot = GM_getValue('lastusedslot') || 'slot1';

    //creates memory for storage
    if (userSavedBarcodes === undefined) {
        userSavedBarcodes = {
            'slot1': [],
            'slot2': [],
            'slot3': []
        }
        GM_setValue('userSB', userSavedBarcodes);
    }

    // Create the button element
    var bannerButton = document.createElement('button')
    bannerButton.setAttribute('id', 'bannerButton');
    document.body.appendChild(bannerButton);

    document.addEventListener('keydown', function(event) {
      // Check if the key combination is Ctrl+Shift
      if (event.ctrlKey && event.altKey) {
        event.preventDefault();
          bannerButton.click();
      }

    });

    ddSide = GM_getValue('ddside')
    // Create keycode banner for keyboard key shortcuts
    var keycodes = document.createElement('div');
    keycodes.setAttribute('id', "keycodeContainer");
    keycodes.setAttribute('style', 'display: none; ');
    keycodes.setAttribute('class', (ddSide === 'flipSBL') ? 'flipKCL' : 'flipKCR')
    keycodes.insertAdjacentHTML("afterbegin", `
                                <img src='https://placehold.co/175x45/grey/white?text=Scanner+Banner' id='mahlogah'>
                                <label class= "kclabels">
                                Enter<br>
                                <img src="https://i.postimg.cc/3J5Kn6Lg/enter-Key-Thin.png" class='kc' width="60">
                                </label>
                                <label class= "kclabels">
                                Refresh<br>
                                <img src="https://i.postimg.cc/1z9XMT3W/f5-Key-Thin.png" class='kc' width="60">
                                </label>
                                <label class= "kclabels">
                                Tab<br>
                                <img src="https://i.postimg.cc/DfgS47fS/tabkeythin.png" class='kc' width="60">
                                </label>
                                `);
    document.body.appendChild(keycodes);

    // Create the dropdown menu
    var dropdown = document.createElement('div');
    dropdown.setAttribute('id', "sbContainer");
    dropdown.setAttribute('class', ddSide);
    dropdown.insertAdjacentHTML("afterbegin", `
                                <input type="text"
                                       id="newBarcode"
                                       maxlength="30"
                                       placeholder="Type barcode. Press Enter.">
                                <br>
                                <select id="saveDropdown" class="styleSaver">
                                  <option value="slot1">Slot 1</option>
                                  <option value="slot2">Slot 2</option>
                                  <option value="slot3">Slot 3</option>
                                </select>
                                <button id='clearAll'>Clear</button>
                                <button id='flip' class='styleSaver'>Flip</button>`);
    document.body.appendChild(dropdown);
    const saveDropdown = document.getElementById('saveDropdown');
    let selectedSlot = saveDropdown.value;
    saveDropdown.value = lastUsedSlot;
    saveDropdown.addEventListener('change', function() {
        userSavedBarcodes = GM_getValue('userSB');
        selectedSlot = saveDropdown.value;
        loadBarcodeSet(userSavedBarcodes[selectedSlot])
    });
    function save() {
        selectedSlot = saveDropdown.value;
        GM_setValue('lastusedslot', selectedSlot);
        userSavedBarcodes[selectedSlot] = barcodes;
        GM_setValue('userSB', userSavedBarcodes);
    }
    let flipButton = document.getElementById('flip');
    let dropdownClass = dropdown.getAttribute('class');

    flipButton.addEventListener('click', function() {
        dropdownClass = dropdown.getAttribute('class');
        if (dropdownClass === 'flipSBL') {
            dropdown.setAttribute('class', 'flipSBR');
            keycodes.setAttribute('class', 'flipKCR');
        } else {
            dropdown.setAttribute('class', 'flipSBL');
            keycodes.setAttribute('class', 'flipKCL');
        }

        GM_setValue('ddside', dropdown.getAttribute('class'));
        GM_setValue('kcside', keycodes.getAttribute('class'));
    })

    // Grab the clear all button element
    var clearAllButton = document.getElementById('clearAll');

       // Function to handle updating autoCopyState
    function updateAutoCopyState() {
        GM_setValue('canSeeBanner', bannerState);
        GM_setValue('canSeeKeycodes', keycodesVisible);
        GM_setValue('ddside', dropdown.getAttribute('class'));
        GM_setValue('kcside', keycodes.getAttribute('class'));
        GM_setValue('nameChanges', altNames);
        GM_setValue('lastusedslot', saveDropdown.value);
    }


    function blurIt(blarray) {
        blarray.forEach(function(bl) {
            if (barcodes.indexOf(bl) !== -1) {
                let blurItAgain = document.getElementById(`${bl}`);
                blurItAgain.style.filter = 'blur(5px)';
            }
        })
    }

    function tempClear() {
        barcodes = [];
        GM_deleteValue("savedArray");
        let grabAllCodes = document.querySelectorAll('[id*="barBox-"]');
        grabAllCodes.forEach(function(code) {
            removeBarcode(code.getAttribute("id"));
        });
    }

    //create barcode with delete button. saves to local storage
    function addBarcode(text) {
        let dupeTest = barcodes.indexOf(text)
        if (dupeTest === -1 && text.length <= 30 && text !== '') {
            dropdown.insertAdjacentHTML("beforeend", `
        <div id="barBox-${text}"class="bContainer">
             <p class="barcodeLabel" id="bl-${text}" hint="${text}">${text}</p>
             <div><i class="fas fa-trash-alt" id="delB-${text}"></i>
             <svg id="${text}"
              class="barcode-svg"
              jsbarcode-format="CODE128"
              jsbarcode-value="${text}"
              jsbarcode-displayvalue="false"
              jsbarcode-linecolor="#30363d"
              jsbarcode-margin="3"
              jsbarcode-marginleft="24"
              jsbarcode-textmargin="0"
              jsbarcode-height="20px"
              jsbarcode-width="1"></svg><div>
        </div>`);
        JsBarcode(".barcode-svg").init();
        blurIt(blurState);

        var deleteButton = document.getElementById(`delB-${text}`);
        deleteButton.addEventListener('click', function() {
            delete altNames[`bl-${text}`];
            if (blurMe.style.filter === 'blur(5px)') { updateBlur() };
            removeBarcode("barBox-" + text);
            let barDex = barcodes.indexOf(text);
            if (barDex !== -1) {
                barcodes.splice(barDex, 1);
                GM_setValue("savedArray", barcodes);
                save();
            }
        });

        let nameChange = (old) => {
            try {
                let newName = prompt("New Name: (30 character max)",`${text}`).trim();
                newName = (newName === null || newName === '') ? old.innerText : newName;
                //console.log('before: ', newName);
                if (newName.length > 30) {newName = newName.substring(0, 30)}
                //console.log('after: ', newName);
                if (newName !== old.innerText) {
                    altNames[old.id] = newName;
                    GM_setValue('nameChanges', altNames);
                    old.innerText = newName;
                }
            } catch (error) {
                console.log(error);
              }

        };
        document.getElementById(`bl-${text}`).addEventListener('click', function() {
            nameChange(this);
        });

        var blurMe = document.getElementById(text);
        function updateBlur() {
            blurMe.style.filter = (blurMe.style.filter !== 'blur(5px)') ? 'blur(5px)' : 'none'
            if (blurMe.style.filter === 'blur(5px)') {
                blurState.push(text); // adding item to array for saving to script storage
                GM_setValue('bluredCodes', blurState); //save array to storage
            }
            else {
                var index = blurState.indexOf(text);
                if (index !== -1) {
                    blurState.splice(index, 1);
                    GM_setValue('bluredCodes', blurState);
                }
            }};

        //creates a blur listener on click
        blurMe.addEventListener('click', function() {
            updateBlur();
        });

        //adds barcodes text to the barcodes array
        barcodes.push(`${text}`);
        GM_setValue("savedArray", barcodes);
        save();
        }
    };

    function loadBarcodes() {
        // Load saved barcodes
        var savedBarcodes = GM_getValue("savedArray", null);
        var secretSaved = savedBarcodes;
        let savedBlurs = GM_getValue('bluredCodes', []);
        blurState = savedBlurs;
        tempClear();
        if (secretSaved!== null && secretSaved !== "") {
            secretSaved.forEach(function(barcode) {
                addBarcode(barcode);
            });
            secretSaved.forEach(function(barcode) {
                if (savedBlurs.indexOf(barcode) !== -1) {
                    let blurItAgain = document.getElementById(`${barcode}`);
                    blurItAgain.style.filter = 'blur(5px)';
                };
            })
        }
        secretSaved = [];
        renameBarcodes(barcodes);
    };
    loadBarcodes();

    function renameBarcodes(anArray) {
        anArray.forEach((bc) => {
            if(altNames){
                if (`bl-${bc}` in altNames) {
                    let bLabel = document.getElementById(`bl-${bc}`)
                    let altName = altNames[`bl-${bc}`];
                    bLabel.innerText = altName;
                }
            };
        });
    };
    function loadBarcodeSet(a) {
        if (barcodes.length > 0) {
            tempClear();
        } else console.log('Empty');
        a.forEach(function(b){
            addBarcode(b);
        });
        renameBarcodes(barcodes);
    }
    function handleTabChange(event) {
      
      if (event.type === 'blur') {
        // Tab is inactive
        updateAutoCopyState();
        } else if (event.type === 'focus') {
            // Tab is active
            ddSide = GM_getValue('ddside');
            kcSide = GM_getValue('kcside');
            lastUsedSlot = GM_getValue('lastusedslot');
            saveDropdown.value = lastUsedSlot;
            dropdown.setAttribute('class', ddSide);
            keycodes.setAttribute('class', kcSide);
            altNames = GM_getValue('nameChanges')|| {};
            loadBarcodes();
            bannerState = GM_getValue('canSeeBanner');
            dropdown.style.display = bannerState;
            keycodesVisible = GM_getValue('canSeeKeycodes');
            keycodes.style.display = keycodesVisible
            }
    }
    // Attach the event listeners to the window object
    window.addEventListener('blur', handleTabChange);
    window.addEventListener('focus', handleTabChange);

    function saveInput () {
        var userInput = document.getElementById("newBarcode").value;
        return userInput;
    };

    //Remove barcode when delete button is clicked
    function removeBarcode(barcodeId) {
    var barcode = document.getElementById(barcodeId);
    barcode.parentNode.removeChild(barcode);
    };

    //remembers if the banner is open or closed on page reload
    dropdown.setAttribute('class', ddSide);
    keycodes.setAttribute('class', kcSide);
    dropdown.style.display = (bannerState === "block") ? "block" : "none";
    keycodes.style.display = (keycodesVisible === "flex") ? "flex" : "none";

    // Show/Hide the banner on button click
    bannerButton.addEventListener('click', function() {
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
            keycodes.style.display = 'flex';
            bannerState = 'block';
            keycodesVisible = 'flex';
            GM_setValue("canSeeBanner", bannerState);
            GM_setValue("canSeeKeycodes", keycodesVisible);
        } else {
            dropdown.style.display = 'none';
            keycodes.style.display = 'none';
            bannerState = 'none';
            GM_setValue("canSeeBanner", bannerState);
            keycodesVisible = 'none';
            GM_setValue("canSeeKeycodes", keycodesVisible);
        }
    });

    //clear locally saved barcodes
    clearAllButton.addEventListener('click', function() {
        let conDelete = confirm('Delete all barcodes?');
        if (conDelete) {
        //reset array to empty
            barcodes = [];
            blurState = [];
            //altNames = {};
        //remove all local storage keys and their values
            /*
            GM_listValues().forEach(function(key) {
                GM_deleteValue(key);
            })
            */
            //remove all storage but saved barcodes object and alternate names
            GM_deleteValue('canSeeBanner');
            GM_deleteValue('canSeeKeycodes');
            //GM_deleteValue('nameChanges');
            GM_deleteValue('savedArray');
            GM_deleteValue('bluredCodes');
        // Select all barcodes in the banner
            var barBoxes = document.querySelectorAll('[id*="barBox-"]');
        // remove barcodes from banner
            barBoxes.forEach(function(box) {
                removeBarcode(box.getAttribute("id"));
            });
            save();
        } else console.log('User cancelled action');
    });

    //generates barcode upon enter keypress and resets input field
    var listenForEnter = document.getElementById("newBarcode");
    listenForEnter.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && this.value !== "") {
      // do something when enter key is pressed
      addBarcode(saveInput());
      //clear input box
      this.value="";
    }
    });

    // Get all elements with the class 'barcode-svg'
    let barcodeElements = document.getElementsByClassName('barcode-svg');
    // Create a click listener for each barcode element
    Array.from(barcodeElements).forEach(element => {
       element.addEventListener('click', handleClick);
    });
     // Click event handler
        function handleClick(event) {
            GM_setValue('bluredCodes', blurState);
    }
    var acPressed = false;
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 17) {
            acPressed = true;
        }
    })
    document.addEventListener('keyup', function(event) {
        if (event.keyCode === 17) {
            acPressed = false;
        }
    })
    document.addEventListener('click', function(event) {
        if (acPressed) {
            event.preventDefault();
            addBarcode(event.target.innerHTML);
        }
    })
})();