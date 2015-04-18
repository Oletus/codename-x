"use strict";

var Unit = function(options) {
    var defaults = {
        name: '',
        projectId: 0,
        codename: '',
        description: '',
        scientist: '',
        tier: 1,
        researchTime: 2,
        singleUse: false,
        instantVictory: false,
        perfectDefense: false,
        properties: [],
        against: {},
        riskFactor: 0
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

Unit.renderIcon = function(ctx, cursorOn, buttonDown, side, x, y, unitType, button) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    
    ctx.fillStyle = side.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    
    ctx.lineWidth = 3;
    if ((cursorOn || button.dragged) && !buttonDown) {
        ctx.strokeStyle = '#fff';
    } else {
        ctx.strokeStyle = side.color;
    }
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(unitType.name, x, y);
};

Unit.Properties = [
    'air',
    'land',
    'sea',
    'space',
    'conventional',
    'infantry',
    'armor',
    'animal',
    'espionage'
];


Unit.TypeData = [
    {
        name: 'Conventional army',
        codename: 'Conventional army',
        description: 'These brave men and women are sadly quite useless. At this rate we will be fighting the war forever.',
        properties: ['land'],
        tier: 0
    },
    {
        name: 'Fruit bat firebombs',
        projectId: 5459,
        codename: 'Bat-bombs',
        description: 'Fruit bats will be equipped with tiny incendiary time bombs and released over enemy territory. They will carry the bombs into building and set them on fire.',
        scientist: 'Dr. Bruce Bayne',
        singleUse: true,
        properties: ['animal'],
        riskFactor: 0.1,
        against: {'conventional': 1}
    },
    {
        name: 'Anti-tank dogs',
        projectId: 8656,
        codename: 'Man\'s Best Friend',
        description: 'Dogs are to be trained to carry explosives, which would detonate on contact with enemy tanks.',
        scientist: 'Dr. Pupp Sharikov',
        singleUse: true,
        properties: ['animal', 'land'],
        riskFactor: 0.1,
        against: {'armor': 1}
    },
    {
        name: 'Pigeon guided missiles',
        codename: 'Birdbrain',
        projectId: 7796,
        description: 'We intend to teach pigeons to recognize enemy targets and peck at the controls to deploy missiles.',
        scientist: 'Dr. B.F. Skinner',
        singleUse: true,
        riskFactor: 0.1,
        properties: ['animal']
    },
    {
        name: 'Malaria mosquitoes',
        codename: 'That Sucks',
        projectId: 9870,
        description: 'Malaria carrying mosquitoes grown in a lab and dropped on enemy territory will infect their troops.',
        scientist: 'Dr. Marsha Land',
        properties: ['animal'],
        riskFactor: 0.1,
        against: {'infantry': 1, 'cold': -1}
    },
    {
        name: 'Flying tanks',
        codename: 'Flying Elephants',
        projectId: 3100,
        description: 'We intend to design a tank equipped with wings. It would be hauled onto an airplane and then dropped onto the battlefield to glide gracefully to the ground.',
        scientist: 'Dr. T. Wausau',
        properties: ['armor'],
        riskFactor: 0.1,
        against: {'air': 1}
    },
    {
        name: 'Triebflügel',
        riskFactor: 0.1,
        codename: 'Triebflügel',
        projectId: 6567,
        description: 'An aircraft with three blades powered by rockets. Vertical take off, speed, well-armoured.',
        scientist: 'Dr. Vay Daar',
        properties: ['air']
    },
    {
        name: 'Iceberg ships',
        riskFactor: 0.1,
        codename: 'On the Rocks',
        projectId: 1008,
        description: 'Due to the shortage of metal, we have designed an aircraft carriers to be built out of cork and ice. It will be used against U-boats.',
        scientist: 'Dr. Ayse Freese',
        properties: ['sea', 'armor']
    },
    {
        name: 'Meth-fueled infantry',
        riskFactor: 0.1,
        codename: 'Happy-Happy Pill',
        projectId: 4209,
        description: 'Crystal methamphetamine is a brilliant creation of the pharmacists that allows our brave soldiers to stay alert, awake and fighting longer and harder. Can be added to chocolate to facilitate ingestion.',
        scientist: 'Dr. Walter Black',
        properties: ['land', 'infantry']
    },
    {
        name: 'Pheromone gas',
        codename: 'Smelly Heart ',
        projectId: 7031,
        description: 'Pheromone based gas which when deployed against enemy troops makes them go mad with lust, causing widespread chaos and moral degradation. Works well on non-human animals.',
        scientist: 'Dr. Strangelove',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.1,
        against: {'animal': 1}
    },
    {
        name: 'Panjandrum',
        codename: 'Panjandrum',
        projectId: 5032,
        description: 'This assault weapon is a barrel of explosives suspended between two massive wheels propelled by rockets.',
        scientist: 'Dr. Wheeler Cart',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.1,
        properties: ['land']
    },
    {
        name: 'Psychic Dogs',
        codename: 'His Master’s Voice',
        projectId: 9033,
        description: 'Our specialized canine school proposes to train dogs to speak. They can be then sent into enemy territory to gather intelligence and report back.',
        scientist: 'Dr. I. P. Pavlov',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.05,
        properties: ['animal']
    },
    {
        name: 'Kamikaze Dolphins',
        codename: 'Flipper',
        projectId: 2035,
        description: 'Dolphins are gentle, playful creatures. We will use these traits to train them to deliver explosives to enemy U-boats.',
        scientist: 'Dr. Willie Shamu',
        tier: 2,
        researchTime: 4,
        properties: ['animal'],
        riskFactor: 0.1,
        against: {'land': -1, 'air': -1}
    },
    {
        name: 'Flaming pigs',
        codename: 'Operation Bacon',
        projectId: 3036,
        description: 'A training and deployment program that will lather pigs in tar, set them on fire and send them into battle.',
        scientist: 'Dr. Pigathius Hogg',
        tier: 2,
        researchTime: 4,
        singleUse: true,
        properties: ['land'],
        riskFactor: 0.1,
        against: {'wet': -1}
    },
    {
        name: '"Who? Me?" stench weapon',
        codename: 'Who? Me?',
        projectId: 4037,
        description: 'A concoction of gases that smell strongly of a substance commonly known as “poo” can be sprayed on enemy officers to embarrass and demoralize them.',
        scientist: 'Dr. Odur Fowle',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.1,
        against: {'armor': 1, 'air': -1}
    },
    {
        name: 'Acoustic Kitty',
        codename: 'Acoustic Kitty',
        projectId: 1038,
        description: 'Our world famous surgeon will implant a listening device, a battery and an antenna into a kitten. It can then be deployed as a very fluffy and adorable spy.',
        scientist: 'Dr. Bartholomew Fussiebootes',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.1,
        properties: ['land', 'animal', 'espionage']
    },
    {
        name: 'Soup Bowl War Ship',
        codename: 'Floating Soup Bowl',
        projectId: 7039,
        description: 'An innovative naval vessel with a circular hull. The design allows this war ship to carry a massive amount of weapons. May fall prey to laws of physics.',
        scientist: 'Dr. B. Owler',
        tier: 2,
        researchTime: 4,
        riskFactor: 0.15,
        properties: ['sea']
    },
    {
        name: 'Space spyglass',
        codename: 'Ant Killer',
        projectId: 6604,
        description: 'We propose setting up a giant mirror in space, which would have the capacity to focus solar rays on enemy cities and burn them.',
        scientist: 'Dr. Yes',
        tier: 3,
        researchTime: 6,
        instantVictory: true,
        riskFactor: 0.25,
        properties: ['space']
    },
    {
        name: 'Chicken-warmed nuclear landmines',
        codename: 'Feeling Clucky',
        projectId: 9076,
        description: 'In order to protect our most strategically valuable cities, we can surround them with nuclear landmines. We will bury the mine with live chickens, which will keep the mechanisms warm through the winter.',
        scientist: 'Dr. Rusty Cogscomb',
        tier: 3,
        researchTime: 6,
        perfectDefense: true,
        riskFactor: 0.25,
        properties: ['animal', 'land']
    }
];

Unit.Types = [];
(function() {
    for (var i = 0; i < Unit.TypeData.length; ++i) {
        Unit.Types.push(new Unit(Unit.TypeData[i]));
    }
})();

Unit.prototype.getEffectivenessAgainst = function(unitB, terrain) {
    // Define helper variables
    var i, property;

    var effectiveness = this.tier;

    //if ( Math.random() <= this.riskFactor ) {
    //    return -1;
    //}

    if (this.instantVictory) {
        return 10;
    }

    if (unitB.instantVictory == false && this.perfectDefense ) {
        return 0;
    }

    if (unitB.perfectDefense) {
        return 0;
    }

    for (i = 0; i < unitB.properties.length; ++i) {
        property = unitB.properties[i];
        if (this.against.hasOwnProperty(property)) {
            effectiveness += this.against[property];
        }
    }
    for (i = 0; i < terrain.length; ++i) {
        property = terrain[i];
        if (this.against.hasOwnProperty(property)) {
            effectiveness += this.against[property];
        }
    }
    return effectiveness;
};

function filterByTier(types, maximumTier) {
    var projects = [];

    for ( var i = 0; i < types.length; i++ ) {
        if ( types[i].tier < 1 ) {
            continue;
        }

        if ( types[i].tier <= maximumTier ) {
            projects.push(types[i]);
        }
    }

    return projects;
}
