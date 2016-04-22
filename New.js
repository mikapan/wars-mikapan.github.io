var particleSystem = [];
var attractors = [];
var table;
var statename = [];
var states = [];
var aggregated = {}; //the object used to store wars and sums of death
var aggregatedStates = {};
var participantsAggregated = {};
var connection = [];
var participantsParticles = [];
//add year to display
var yearToDisplay = 1823;
var connections = [];
var participants = [];
var wars = [];
var button;
var home;


function preload() {
    table = loadTable("data/Inter-StateWars.csv", "csv", "header");
    home = getURL("index.html");
}

function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);

   
    button = createButton('Back');
    button.position(width / 2 - 30, height / 2 + 300);
    button.mousePressed(goBack);

    textAlign(CENTER);

    colorMode(HSB, 360, 100, 100, 100);
    background(0);

    print(table.getRowCount() + " total rows in table");


    setupData();

}

function setupData() {
    //aggregates wars into the object aggregated

    aggregated = {};
    participantsAggregated = {};
    connections = [];
    participantsParticles = [];
    wars = [];

    for (var r = 0; r < table.getRowCount(); r++) {

        var startYear = table.getString(r, "StartYear");
        var endYear = table.getString(r, "EndYear");

        if (yearToDisplay <= endYear && yearToDisplay >= startYear) {
            var wname = table.getString(r, "WarName");
            var death = table.getString(r, "BatDeath");
            var sname = table.getString(r, "StateName");
            var location = table.getString(r, "Location");

            death = parseInt(death);
            if (!isNaN(death)) {
                if (aggregated.hasOwnProperty(wname)) {
                    aggregated[wname] = aggregated[wname] + death;
                } else {
                    aggregated[wname] = death;
                }
            }
            print(sname);
            participantsAggregated[sname] = location;
        }
    }
    //lets put the object into an array
    var aAggregated = [];


    //converts the aggregated object into an array of objects {name : name_, sum : sum_}
    Object.keys(aggregated).forEach(function (wname_) {
        var war = {};
        war.name = wname_;
        war.sum = aggregated[wname_];
        wars.push(war);
    });

    //aggregated participants
    //print(participantsAggregated);

    Object.keys(participantsAggregated).forEach(function (sname_) {

        var participant = {};
        participant.name = sname_;
        participant.location = participantsAggregated[sname_];
        participants.push(participant);
    });

    particleSystem = [];
    for (var i = 0; i < wars.length; i++) {
        var pos = createVector(0, 0);

        switch (i) {
        case 0:
            pos = createVector(width / 3.5, height / 2.5);
            break;
        case 1:
            pos = createVector(width / 2, height / 2.5);
            break;
        case 2:
            pos = createVector(width / 1.4, height / 2.5);
            break;
        case 3:
            pos = createVector(width / 3.5, height / 1.3);
            break;
        case 4:
            pos = createVector(width / 2, height / 1.3);
            break;
        case 5:
            pos = createVector(width / 1.4, height / 1.3);
            break;

        }
        var aaaa = new Attractor(pos, 1);
        print(aaaa);
        var p = new Particle(wars[i].name, wars[i].sum, aaaa, true);
        particleSystem.push(p);
    }

    //aggregate participant

    for (var r = 0; r < table.getRowCount(); r++) {

        var wname = table.getString(r, "WarName");
        var death = table.getString(r, "BatDeath");
        var sname = table.getString(r, "StateName");
        var location = table.getString(r, "Location");

        var foundWar = wars.find(function (element) {
            return element.name == wname;
        });


        if (foundWar) {

            var foundParticipant = participants.find(function (element) {
                return element.name == sname;
            });

            print(foundParticipant);

            if (foundParticipant) {

                var connection = {};
                connection.war = foundWar;
                connection.participant = foundParticipant;
                connection.death = death;
                connections.push(connection);

            }

        }

    }
    //after this we have the connections setup

    var newParticles = [];
    wars.forEach(function (war) {
        var wname = war.name;

        connections.forEach(function (c) {
            if (c.war.name == wname) {
                //grab the participant
                var participantName = c.participant.name;
                var deaths = c.death;

                particleSystem.forEach(function (warParticle) {
                    if (warParticle.name == wname) {
                        var attractor = warParticle.attractor;
                        var newParticle = new Particle(participantName, deaths, attractor, false);
                        newParticles.push(newParticle);

                    }

                });

            }

        });

    });


    newParticles.forEach(function (p) {
        particleSystem.push(p);
    });


}


function draw() {
    background(0);

    if (changeData) {
        changeData = false;
        setupData();
    }

    //for each participant in the current year
    //empty the particlesystem and create new particles for each participant

    /*checks for pairs of particles*/
    for (var STEPS = 0; STEPS < 3; STEPS++) {
        for (var i = 0; i < particleSystem.length - 1; i++) {
            for (var j = i + 1; j < particleSystem.length; j++) {
                var pa = particleSystem[i];
                var pb = particleSystem[j];
                var ab = p5.Vector.sub(pb.pos, pa.pos);
                var distSq = ab.magSq();
                if (distSq <= sq(pa.radius + pb.radius)) {
                    var dist = sqrt(distSq);
                    var overlap = (pa.radius + pb.radius) - dist;
                    ab.div(dist); //ab.normalize();
                    ab.mult(overlap * 0.5);
                    pb.pos.add(ab);
                    ab.mult(-1);
                    pa.pos.add(ab);

                    pa.vel.mult(0.97);
                    pb.vel.mult(0.97);

                }
            }
        }
    }


    for (var i = particleSystem.length - 1; i >= 0; i--) {
        var p = particleSystem[i];

        p.update();
        p.draw();
    }

    textSize(85);
    //color for the year
    fill(0, 100, 50);
    text(yearToDisplay, windowWidth / 2, windowHeight / 6);

    textSize(12);
    drawLegend();

    if (mouseY > height * 0.89 && mouseY < height * 0.91) {
        newYearToDisplay = round(map(mouseX, 0, width, 1823, 2003));
        textSize(16);
        //color for year on time line
        fill(0, 100, 75);
        text(newYearToDisplay, mouseX, mouseY);
    }

    for (var i = 1823; i < 2003; i++) {
        var x = round(map(i, 1823, 2003, 0, width));
        //color for timeline
        fill(0, 100, 50);
        ellipse(x, height * 0.9, 3, 3);
    }

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

}



var Particle = function (name, sum, aaaa, isWar) {
    this.name = name;
    this.sum = sum;
    this.location = "";
    this.radius = sqrt(sqrt(sqrt(sum))) * 6.5;
    var initialRadius = this.radius;
    this.attractor = aaaa;
    this.isWar = isWar;

    var isMouseOver = false;


    var minimumRadius = 10;
    var maximumRadius = 100;


    this.pos = createVector(0, 0);


    if (isWar) {
        this.pos.set(aaaa.pos.x, aaaa.pos.y);
    } else {
        var tempAng = random(TWO_PI);
        this.pos = createVector(cos(tempAng), sin(tempAng));
        //this.pos.div(this.radius);
        this.pos.mult(this.radius * 6);
        this.pos.add(aaaa.pos);

    }


    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);


    //color coding for location start

    //color of the war particle
    this.color = {
        h: 0,
        s: 100,
        b: 50
    }; 

    var rowLoc = table.findRow(this.name, "StateName");

    if (rowLoc != null) {
        this.location = rowLoc.get("Location");

        switch (this.location) {
            //WH
        case "1":
            this.color = {
                h: 27,
                s: 61,
                b: 89
            };
            break;
            //europe
        case "2":
            this.color = {
                h: 209,
                s: 45,
                b: 86
            };
            break;
            //asia
        case "3":
            this.color = {
                h: 306,
                s: 23,
                b: 71
            };
            break;
            //africa
        case "4":
            this.color = {
                h: 20,
                s: 12,
                b: 58
            };
            break;
            //austrilia
        case "5":
            this.color = {
                h: 198,
                s: 72,
                b: 71
            };
            break;
            //middle east
        case "6":
            this.color = {
                h: 166,
                s: 36,
                b: 63
            };
            break;
        }
    }

    //color coding for location end


    var initialLifeSpan = random(100, 200);
    this.lifeSpan = initialLifeSpan;
    this.hue = random(0, 15);
    var psizesq = this.psize * this.psize;


    this.update = function () {
        checkMouse(this);

        this.lifeSpan--;
        var A = aaaa;
        var att = p5.Vector.sub(A.pos, this.pos);

        var distanceSq = att.magSq();
        if (distanceSq > 1) {
            att.normalize();
            att.div(20);
            att.mult(A.getStrength());

            acc.add(att);
        }

        this.vel.add(acc);
        this.vel.limit(5);
        this.pos.add(this.vel);
        acc.mult(0);
    }

    //features of the year start
    this.yearToDisplay = yearToDisplay;
    textSize(85);
    textFont("Univers");
    textStyle(BOLD)
        //features of the year end


    this.draw = function () {
            noStroke();


            fill(this.color.h, this.color.s, this.color.b);

            
        ellipse(this.pos.x,
                this.pos.y,
                this.radius * 2,
                this.radius * 2);
            if (this.radius == maximumRadius) {
                textFont("Univers");
                textStyle(BOLD);
                textSize(14);
                //color of the war
                fill(0, 0, 100);
                text(this.name, this.pos.x, this.pos.y);
                //color of casualty
                textSize(9);
                fill(0, 0, 90);
                text('Casualty:' + nfc(this.sum), this.pos.x, this.pos.y + 20)
            }


        }
        //add new function for expand
    function checkMouse(instance) {
        var mousePos = createVector(mouseX, mouseY);
        if (mousePos.dist(instance.pos) <= instance.radius) {
            incRadius(instance);
            isMouseOver = true;
        } else {
            decRadius(instance);
            isMouseOver = false;
        }
    }

    function incRadius(instance) {
        instance.radius += 4;
        if (instance.radius > maximumRadius) {
            instance.radius = maximumRadius;
        }
    }

    function decRadius(instance) {
        instance.radius -= 4;
        if (instance.radius < initialRadius) {
            instance.radius = initialRadius;
        }
    }


    //
    this.getPos = function () {
        return this.pos;
    }

    this.getMouseOver = function () {
        return isMouseOver;
    }

}



var Attractor = function (pos_, s) {
    this.pos = pos_.copy();
    var strength = s;
    this.draw = function () {
        //noStroke();
        //color of attractor
        fill(0,100,40);
        ellipse(this.pos.x, this.pos.y,
            strength, strength);
    }


    this.getStrength = function () {
        return strength;
    }
    this.getPos = function () {
        return this.pos.copy();
    }
}


//change the year start

var changeData = false;

function keyPressed() {


    if (keyCode == RIGHT_ARROW) {
        yearToDisplay++;
    } else if (keyCode == LEFT_ARROW) {
        yearToDisplay--;
    }

    if (yearToDisplay < 1823) {
        yearToDisplay = 2003;
    } else if (yearToDisplay > 2003) {
        yearToDisplay = 1823;
    }

    changeData = true;

    return false;

}
//change the year end

function mouseMoved() {
    if (mouseY > height * 0.89 && mouseY < height*0.91) {
        newYearToDisplay = round(map(mouseX, 0, width, 1823, 2003));
        if (newYearToDisplay != yearToDisplay) {
            yearToDisplay = newYearToDisplay;
            changeData = true;
        }
    }

}


//draw the reference for locations

function drawLegend() {
    var arr = [

        {
            text: 'Americas',
            color: '#e49758'
        },
        {
            text: 'Europe',
            color: '#7aaddc'
        },
        {
            text: 'Africa',
            color: '#958983'
        },
        {
            text: 'Asia',
            color: '#b48bb0'
        },
        {
            text: 'Middle East',
            color: '#67A193'
        },
        {
            text: 'Austrilia',
            color: '#338eb4'
        },
    ];
    arr.forEach(function (e, i) {

        textSize(12);
        fill(e.color);
        noStroke();
        ellipse(90, 50 + i * 17, 15, 15);
        textAlign(LEFT)
        text(e.text, 105, 55 + i * 17);
    });
}
//draw the location end

function goBack() {
    return home
}