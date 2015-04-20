'use strict';

var SideBar = function() {
    this.mainDiv = document.createElement('div');
    this.mainDiv.id = 'sidebar';
    canvasWrapper.appendChild(this.mainDiv);
    this.unitNameElement = this.appendToThis('h2');
    this.descriptionElement = this.appendToThis('p');
    this.singleUseElement = this.appendToThis('p');
    this.powerElement = this.appendToThis('p');
    this.attributesElement = this.appendToThis('div');
    
    // Not shown, only here so functions can be reused:
    this.codeNameElement = document.createElement('p');
    this.researchTimeElement = document.createElement('p');
    this.proposalElement = document.createElement('p');
    this.imgElement = document.createElement('img');

    this.setUnit(null);
};

SideBar.prototype.appendToThis = function(type, classToAdd) {
    var element = document.createElement(type);
    this.mainDiv.appendChild(element);
    if (classToAdd !== undefined) {
        element.classList.add(classToAdd);
    }
    return element;
};

SideBar.prototype.appendToAttributes = function(options) {
    var defaults = {
        property: 'name',
        value: undefined,
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            options[key] = defaults[key];
        }
    }
    var p = document.createElement('p');
    p.classList.add('unitAttribute');
    if (options.value === undefined) {
        p.textContent = options.property;
        p.classList.add('property');
    } else {
        p.textContent = (options.value > 0 ? '+' : '') + options.value + ' against ' + options.property;
        if (options.value >= 0) {
            p.classList.add('good');
        } else {
            p.classList.add('bad');
        }
        p.classList.add('against');
    }
    this.attributesElement.appendChild(p);
};

SideBar.prototype.render = function() {
    this.mainDiv.style.transform = 'scale(' + resizer.getScale() + ')';
};

SideBar.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

SideBar.prototype.setUnit = function(unit, extratext) {
    if (extratext === undefined) {
        extratext = '';
    }
    this.unit = unit;
    if (unit !== null) {
        this.mainDiv.style.display = 'inline';
        this.unitNameElement.textContent = extratext + unit.name;
        this.codeNameElement.textContent = 'CODENAME: ' + unit.codename;
        this.descriptionElement.textContent = unit.description;
        this.proposalElement.textContent = unit.proposal;
        if (unit.singleUse) {
            this.singleUseElement.textContent = 'SINGLE USE. This unit will be destroyed once used.';
        } else {
            this.singleUseElement.textContent = '';
        }
        this.powerElement.textContent = 'Combat strength: ' + unit.power;
        this.researchTimeElement.textContent = 'Research time: ' + unit.researchTime;

        this.attributesElement.innerHTML = '';
        if (unit.intelPower > 0) {
            this.appendToAttributes({property: 'intel bonus: ' + unit.intelPower + ' (' + Math.floor(unit.intelPower / 2) + ' in reserve)'});
        }
        for (var i = 0; i < unit.properties.length; ++i) {
            this.appendToAttributes({property: unit.properties[i]});
        }
        for (var prop in unit.against) {
            if (unit.against.hasOwnProperty(prop)) {
                this.appendToAttributes({property: prop, value: unit.against[prop]});
            }
        }

        if (unit.blackIconSprite) {
            this.imgElement.src = unit.blackIconSprite.url();
            this.imgElement.style.display = 'block';
        } else {
            this.imgElement.style.display = 'hidden';
        }
    } else {
        this.mainDiv.style.display = 'none';
    }
};
