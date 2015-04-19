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
    
    this.codeNameElement = document.createElement('p');
    this.researchTimeElement = document.createElement('p');

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

SideBar.prototype.setUnit = function(unit) {
    this.unit = unit;
    if (unit !== null) {
        this.mainDiv.style.display = 'inline';
        this.unitNameElement.textContent = unit.name;
        this.codeNameElement.textContent = 'CODENAME: ' + unit.codename;
        this.descriptionElement.textContent = unit.description;
        if (unit.singleUse) {
            this.singleUseElement.textContent = 'SINGLE USE. This unit will be destroyed once used.';
        } else {
            this.singleUseElement.textContent = '';
        }
        this.powerElement.textContent = 'Power: ' + unit.power;
        this.researchTimeElement.textContent = 'Research time: ' + unit.researchTime;
        this.attributesElement.innerHTML = '';
        for (var i = 0; i < unit.properties.length; ++i) {
            this.appendToAttributes({property: unit.properties[i]});
        }
        for (var prop in unit.against) {
            if (unit.against.hasOwnProperty(prop)) {
                this.appendToAttributes({property: prop, value: unit.against[prop]});
            }
        }
    } else {
        this.mainDiv.style.display = 'none';
    }
};
