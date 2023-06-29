// Mapeamento de Texturas 

import * as THREE           from 'three';
import { OrbitControls }    from '../../Assets/scripts/three.js/examples/jsm/controls/OrbitControls.js';
import { GUI }              from '../../Assets/scripts/three.js/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer }   from '../../Assets/scripts/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }       from "../../Assets/scripts/three.js/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass }       from "../../Assets/scripts/three.js/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass }       from "../../Assets/scripts/three.js/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RectAreaLightHelper }       from "../../Assets/scripts/three.js/examples/jsm/helpers/RectAreaLightHelper.js";

const   rendSize    = new THREE.Vector2();

var     renderer,
        scene,
        camera,
        cameraControl,
        params;

var     planetaMat      = [];

const   planetas =      {   MERCURIO    : 0,
                            VENUS       : 1,
                            TERRA       : 2,
                            MARTE       : 3,
                            JUPITER     : 4,
                            SATURNO     : 5,
                            URANO       : 6,
                            NETUNO      : 7,
                            SOL         : 8,
                            LUA         : 9,
                        }

var textPath = "../../Assets/Textures/solarSystem/2k-images/";

var texturas    =   [   "2k_mercury.jpg",
                        "2k_venus_surface.jpg",
                        "2k_earth_daymap.jpg",
                        "2k_mars.jpg",
                        "2k_jupiter.jpg",
                        "2k_saturn.jpg",
                        "2k_neptune.jpg",
                        "2k_uranus.jpg",
                        "2k_sun.jpg",
                        "2k_moon.jpg"
                    ];

var ringsText,
    ringsMat;

// var gui             = new GUI();

var planetObjects = [];
var planetNames = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "sun"]

var bloomComposer;

class Planet {
    constructor(scene, name, material, planet_radius, x_radius, z_radius, initial_theta) {
        this.name = name;
        this.scene = scene;

        let geometry = new THREE.SphereGeometry(planet_radius, 60, 60);
        let mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;

        this.mesh = mesh;
        scene.add(mesh);

        this.x_radius = x_radius;
        this.z_radius = z_radius;
        this.theta = initial_theta;
        this.setTheta(initial_theta);

        let curve = new THREE.EllipseCurve(
            0, 0,
            x_radius, z_radius,
            0, 2 * Math.PI,
            false,
            0,
        );

        let points = curve.getPoints(50);
        // rotate ellipsis to the XZ axis
        points.forEach(p => {p.z = -p.y; p.y = 0;});
        let curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
        let curveMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });

        let ellipse = new THREE.Line(curveGeometry, curveMaterial);

        scene.add(ellipse);
    }

    setTheta(theta) {
        let x = this.x_radius * Math.cos(theta); 
        let z = -1 * this.z_radius * Math.sin(theta);
        let obj = scene.getObjectByName(this.name);
        obj.position.x = x;
        obj.position.z = z;
        this.theta = theta;
    }

    increaseTheta(delta_theta) {
        this.setTheta(this.theta + delta_theta);
    }
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function main() {

    var clock = new THREE.Clock();

    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth*0.8, window.innerHeight*0.8);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.x = 0;
    camera.position.y = 40;
    camera.position.z = 0;
    camera.lookAt(scene.position);
    cameraControl = new OrbitControls(camera, renderer.domElement);

    createPlanetsMaterial();
    // initGUI();

    // cria esfera dos planetas
    // let malhaPlaneta        = new THREE.Mesh(   new THREE.SphereGeometry(15, 60, 60), 
    //                                             planetaMat[planetas.MERCURIO]
    //                                         );
    // malhaPlaneta.name   = "planeta";
    // scene.add(malhaPlaneta);

    for (let i = planetas.MERCURIO; i < planetas.NETUNO; i++) {
        console.log(`Adding planet ${planetNames[i]} (${i})`);
        let planet = new Planet(scene, planetNames[i], planetaMat[i], 5, 50*(i+1), 60*(i+1), Math.PI/8 * 0.57 * i * i);
        planetObjects.push(planet);
    }

    // let ringsGeom = new THREE.RingGeometry( 25, 35, 60 );
    // var pos = ringsGeom.attributes.position;
    // var v3 = new THREE.Vector3();
    // for (let i = 0; i < pos.count; i++){
    //     v3.fromBufferAttribute(pos, i);
    //     ringsGeom.attributes.uv.setXY(i, v3.length() < 26 ? 0 : 1, 1);
    // }

    // let rings = new THREE.Mesh  ( ringsGeom, ringsMat );
    // rings.name = "rings";
    // rings.visible = false;
    // rings.rotateX(Math.PI / 2.0);

    // malhaPlaneta.add(rings);

    // Luz ambiente
    var ambientLight    = new THREE.AmbientLight(0x111111);
    ambientLight.name   = 'ambient';
    scene.add(ambientLight);

    // Sol e luz solar
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set( 3.0, 3.0, 0.0 ).normalize();
    directionalLight.name = 'directional';
    // scene.add(directionalLight);

    let pointLight = new THREE.PointLight(0xFFFFFF, 3, 0, 10.0);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    let renderScene = new RenderPass(scene, camera);
    let bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85,
    );
    bloomComposer = new EffectComposer(renderer);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.renderToScreen = true;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    // const color = new THREE.Color("#FDB813");
    // const geometry = new THREE.IcosahedronGeometry(20, 15);
    // const material = new THREE.MeshBasicMaterial({ color: color });
    // const sphere = new THREE.Mesh(geometry, material);
    // sphere.position.set(0, 0, 0);
    // sphere.layers.set(1);
    // scene.add(sphere);

    let sun = new Planet(scene, "sun", planetaMat[planetas.SOL], 20, 0, 0, 0);

    // Background de galáxias
    let textureLoader = new THREE.TextureLoader();
    textureLoader.path = textPath;
    let galaxyGeometry = new THREE.SphereGeometry(1000, 64, 64);
    let galaxyMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load("2k_stars.jpg"),
        side: THREE.BackSide,
        transparent: true,
    });
    let galaxyMesh = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(galaxyMesh);

    // Plane mesh and axis helper
    var gridXY = new THREE.GridHelper(1000, 100);
    // scene.add(gridXY);

    render();
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function createPlanetsMaterial() {

    var planetasTexturas = [];
    
    var textureLoader   = new THREE.TextureLoader();
    textureLoader.path = textPath;

    for (var i = planetas.MERCURIO ; i <= planetas.LUA ; i++) {
        planetasTexturas[i] = textureLoader.load(texturas[i]);
        console.log(`${i}: ${texturas[i]}`);
    }

    for (i = planetas.MERCURIO ; i <= planetas.LUA ; i++) {
        if (i === planetas.SOL) {
            planetaMat[i]   = new THREE.MeshPhongMaterial( { map : planetasTexturas[i], emissive: 0xEDB813 });
        } else {
            planetaMat[i]   = new THREE.MeshPhongMaterial( { map : planetasTexturas[i] });
        }
    }

    ringsText   = textureLoader.load("2k_saturn_ring_alpha.png");
    ringsMat    = new THREE.MeshPhongMaterial( {    map         : ringsText, 
                                                    transparent : true,
                                                    side        : THREE.DoubleSide });
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function render() {

    cameraControl.update();

    // let p = scene.getObjectByName("planeta");

	// p.rotation.y+=0.0005;

    planetObjects.forEach((planet) => {
        planet.increaseTheta(2 * Math.PI / (60 * 20));
    });

    // renderer.render(scene, camera);

    bloomComposer.render();
    requestAnimationFrame(render);
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function initGUI() {    
    params =    {   planeta : "Mercurio"
                };

    gui.add( params, 'planeta', [   "Mercurio", 
                                    "Venus", 
                                    "Terra", 
                                    "Marte",
                                    "Jupiter",
                                    "Saturno",
                                    "Netuno",
                                    "Urano",
                                    "Lua", 
                                    "Sol" ] ).onChange(mudaPlaneta);
    gui.open();
};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function mudaPlaneta() {
    let obj     = scene.getObjectByName("planeta");
    scene.getObjectByName("rings").visible = false;

    switch (params.planeta) {
        case "Mercurio" :   obj.material = planetaMat[planetas.MERCURIO];
                            break;

        case "Venus"    :   obj.material = planetaMat[planetas.VENUS];
                            break;

        case "Terra"    :   obj.material = planetaMat[planetas.TERRA];
                            break;

        case "Marte"    :   obj.material = planetaMat[planetas.MARTE];
                            break;

        case "Jupiter"  :   obj.material = planetaMat[planetas.JUPITER];
                            break;

        case "Saturno"  :   obj.material = planetaMat[planetas.SATURNO];
                            scene.getObjectByName("rings").visible = false;
                            break;

        case "Urano"    :   obj.material = planetaMat[planetas.URANO];
                            break;

        case "Netuno"   :   obj.material = planetaMat[planetas.NETUNO];
                            break;

        case "Sol"      :   obj.material = planetaMat[planetas.SOL];
                            break;

        case "Lua"      :   obj.material = planetaMat[planetas.LUA];
                            break;
        };
};

/// ***************************************************************
/// ***************************************************************
/// ***************************************************************

main();
