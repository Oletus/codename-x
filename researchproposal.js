"use strict";

var ResearchProposal = function(index, select) {
    this.mainDiv = document.createElement('div');
    this.mainDiv.id = 'research' + index;
    this.mainDiv.classList.add('researchProposal');
    canvasWrapper.appendChild(this.mainDiv);
    this.unitNameElement = this.appendToThis('h2');
    this.codeNameElement = this.appendToThis('h3', 'codename');
    this.proposalElement = this.appendToThis('p');
    this.singleUseElement = this.appendToThis('p');
    this.powerElement = this.appendToThis('p');
    this.attributesElement = this.appendToThis('div');
    this.researchTimeElement = this.appendToThis('p', 'researchTime');
    
    this.descriptionElement = document.createElement('p'); // Not shown

    this.mainDiv.style.position = 'absolute';
    this.mainDiv.style.left = (index * 450 + 40) + 'px';
    
    this.setUnit(null);
    
    this.mainDiv.addEventListener('mousedown', select);
    this.mainDiv.addEventListener('touchstart', select);
};

ResearchProposal.prototype.hilight = function(light) {
    if (light) {
        this.mainDiv.classList.add('hilight');
    } else {
        this.mainDiv.classList.remove('hilight');
    }
};

ResearchProposal.prototype.appendToThis = SideBar.prototype.appendToThis;

ResearchProposal.prototype.appendToAttributes = SideBar.prototype.appendToAttributes;

ResearchProposal.prototype.render = SideBar.prototype.render;

ResearchProposal.prototype.update = SideBar.prototype.update;

ResearchProposal.prototype.setUnit = SideBar.prototype.setUnit;
