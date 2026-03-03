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
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BufferGeometry();
// Create a filled oval (ellipse) shape
const segments = 32;
const vertices = [];
const indices = [];
const radiusX = 3;
const radiusY = 5;

// Add center vertex
vertices.push(0, 0, 0);

// Add vertices around the perimeter
for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(
        Math.cos(angle) * radiusX,
        Math.sin(angle) * radiusY,
        0
    );
}

// Create triangle indices from center to perimeter
for (let i = 0; i < segments; i++) {
    const nextI = (i + 1) % segments;
    indices.push(0, i + 1, nextI + 1);
}

geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

// Light grey solid ovals (subtle background)
const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: false }); 
const mesh = new THREE.InstancedMesh(geometry, material, NUM_BOIDS);
scene.add(mesh);

const dummy = new THREE.Object3D();

function animate() {
    requestAnimationFrame(animate);
    
    boids.update(window.innerWidth, window.innerHeight);

    for (let i = 0; i < NUM_BOIDS; i++) {
        dummy.position.set(boids.positions[i * 2], boids.positions[i * 2 + 1], 0);
        // Point in direction of travel
        dummy.rotation.z = Math.atan2(boids.velocities[i * 2 + 1], boids.velocities[i * 2]) - Math.PI / 2;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.left = 0;
    camera.right = width;
    camera.top = height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
    boids.update(width, height);
});

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

// Theme toggle functionality
const themeButtons = document.querySelectorAll('.theme-btn');
const root = document.documentElement;

function updateProjectLinks(theme) {
    document.querySelectorAll('.project-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) {
            return;
        }

        const url = new URL(href, window.location.origin);
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
        material.color.set(0x888888); // darker gray for boids in dark mode
        document.body.classList.add('dark-mode');
    } else {
        root.style.setProperty('--bg-white', '#ffffff');
        root.style.setProperty('--text-grey', '#888888');
        scene.background = new THREE.Color(0xffffff);
        material.color.set(0xdddddd); // lighter gray for boids in light mode
        document.body.classList.remove('dark-mode');
    }
}

animate();