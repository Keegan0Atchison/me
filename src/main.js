import * as THREE from 'three';
import { BoidLogic } from './BoidLogic.js';

const NUM_BOIDS = 700;
let width = window.innerWidth;
let height = window.innerHeight;

const boids = new BoidLogic(NUM_BOIDS, width, height);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // White background

// Orthographic Camera: (left, right, top, bottom)
const camera = new THREE.OrthographicCamera(0, width, height, 0, 0.1, 1000);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.transform = 'none';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

const geometry = new THREE.CylinderGeometry(0, 2.72, 10.8, 4, 2);
geometry.rotateX(Math.PI / 2);
let boidRenderScale = 1;
const rotationSpeed = 0.1;
const velocityThresholdSq = 0.01;
const FORWARD_AXIS = new THREE.Vector3(0, 0, 1);

// Light grey solid ovals (subtle background)
const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: false,
    transparent: true,
    opacity: 0.82,
    flatShading: true
});
const mesh = new THREE.InstancedMesh(geometry, material, NUM_BOIDS);
scene.add(mesh);

const dummy = new THREE.Object3D();
const velocityDirection = new THREE.Vector3();
const boidQuaternions = Array.from({ length: NUM_BOIDS }, () => new THREE.Quaternion());
const boidTargetQuaternions = Array.from({ length: NUM_BOIDS }, () => new THREE.Quaternion());

function initializeBoidOrientations() {
    for (let i = 0; i < NUM_BOIDS; i++) {
        const vx = boids.velocities[i * 2];
        const vy = boids.velocities[i * 2 + 1];
        const speedSq = vx * vx + vy * vy;

        if (speedSq > velocityThresholdSq) {
            velocityDirection.set(vx, vy, 0).normalize();
            boidTargetQuaternions[i].setFromUnitVectors(FORWARD_AXIS, velocityDirection);
            boidQuaternions[i].copy(boidTargetQuaternions[i]);
        } else {
            boidQuaternions[i].identity();
            boidTargetQuaternions[i].identity();
        }
    }
}

function getBoidRenderScale(screenWidth) {
    if (screenWidth < 480) return 0.45;
    if (screenWidth < 768) return 0.58;
    if (screenWidth < 1024) return 0.67;
    return 0.78;
}

function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;

    boidRenderScale = getBoidRenderScale(width);
    boids.setResponsiveScale(width, height);

    renderer.setSize(width, height);

    camera.aspect = width / Math.max(height, 1);
    camera.left = 0;
    camera.right = width;
    camera.top = height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    
    boids.update(width, height);

    for (let i = 0; i < NUM_BOIDS; i++) {
        const vx = boids.velocities[i * 2];
        const vy = boids.velocities[i * 2 + 1];
        const speedSq = vx * vx + vy * vy;

        if (speedSq > velocityThresholdSq) {
            velocityDirection.set(vx, vy, 0).normalize();
            boidTargetQuaternions[i].setFromUnitVectors(FORWARD_AXIS, velocityDirection);
            boidQuaternions[i].slerp(boidTargetQuaternions[i], rotationSpeed);
        }

        dummy.position.set(boids.positions[i * 2], boids.positions[i * 2 + 1], 0);
        dummy.scale.set(boidRenderScale, boidRenderScale, 1);
        dummy.quaternion.copy(boidQuaternions[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
}

window.onresize = handleResize;

// Page switcher functionality
const navLinks = document.querySelectorAll('.nav-links a');

function showSection(targetId) {
    const targetSection = document.getElementById(targetId) || document.getElementById('home');

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').substring(1);
        showSection(target);
        history.replaceState(null, '', `#${target}`);
    });
});

const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home';
showSection(initialSection);

initializeBoidOrientations();
handleResize();

// Theme toggle functionality
const themeButtons = document.querySelectorAll('.theme-btn');
const root = document.documentElement;

function updateProjectLinks(theme) {
    document.querySelectorAll('.project-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) {
            return;
        }

        const url = new URL(href, window.location.href);
        url.searchParams.set('theme', theme);
        link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    });
}

// Set initial theme from URL or local storage
const params = new URLSearchParams(window.location.search);
const initialTheme = params.get('theme') || localStorage.getItem('theme') || 'dark';
let currentTheme = initialTheme;
updateTheme(initialTheme);

themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        updateTheme(theme);
    });
});

function updateTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    updateProjectLinks(theme);
    
    // Update active button
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    // Update CSS variables and boid colors
    if (theme === 'dark') {
        root.style.setProperty('--bg-white', '#1a1a1a');
        root.style.setProperty('--text-grey', '#cccccc');
        scene.background = new THREE.Color(0x1a1a1a);
        material.color.set(0xffffff);
        document.body.classList.add('dark-mode');
    } else {
        root.style.setProperty('--bg-white', '#ffffff');
        root.style.setProperty('--text-grey', '#555555');
        scene.background = new THREE.Color(0xffffff);
        material.color.set(0x000000);
        document.body.classList.remove('dark-mode');
    }
}

animate();