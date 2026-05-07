document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initFormLogic();
    initImageUpload();
});

// --- Map & Geolocation ---
let map;
let marker;

function initMap() {
    // Default to Bouira center if no location
    const defaultLat = 36.374; 
    const defaultLng = 3.902; 

    map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Click to set location
    map.on('click', (e) => {
        updateLocation(e.latlng.lat, e.latlng.lng);
    });

    // Button handler
    document.getElementById('locateBtn').addEventListener('click', () => {
        const statusSpan = document.getElementById('gpsStatus');
        statusSpan.textContent = "Recherche en cours...";
        
        if (!navigator.geolocation) {
            statusSpan.textContent = "Géolocalisation non supportée par votre navigateur.";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                updateLocation(position.coords.latitude, position.coords.longitude);
                statusSpan.textContent = "Position détectée !";
                statusSpan.style.color = "#00C853";
            },
            () => {
                statusSpan.textContent = "Impossible de récupérer votre position.";
                statusSpan.style.color = "#EF4444";
            }
        );
    });
}

function updateLocation(lat, lng) {
    // Update hidden inputs
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    // Update Marker
    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }
    
    // Pan map
    map.setView([lat, lng], 16);
    
    // Visual feedback text
    const statusSpan = document.getElementById('gpsStatus');
    statusSpan.textContent = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// --- Form Logic (Dependent Fields) ---
function initFormLogic() {
    const radioInputs = document.querySelectorAll('input[name="waste_type"]');
    const complaintTypeGroup = document.getElementById('complaintTypeGroup');
    const complaintSelect = document.getElementById('complaint_type');

    function toggleComplaintType() {
        const selectedValue = document.querySelector('input[name="waste_type"]:checked').value;
        if (selectedValue === 'menager') {
            complaintTypeGroup.style.display = 'block';
            complaintSelect.setAttribute('required', 'required');
            // Add visual selection style updates for radios
            document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            document.querySelector('input[name="waste_type"][value="menager"]').closest('.radio-card').classList.add('selected');
        } else {
            complaintTypeGroup.style.display = 'none';
            complaintSelect.removeAttribute('required');
            complaintSelect.value = ""; // Reset value
            // Add visual selection style updates
            document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            document.querySelector('input[name="waste_type"][value="inerte"]').closest('.radio-card').classList.add('selected');
        }
    }

    radioInputs.forEach(input => {
        input.addEventListener('change', toggleComplaintType);
    });

    // Submit handler (Real API)
    document.getElementById('complaintForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        
        // Basic validation
        const lat = document.getElementById('lat').value;
        if (!lat) {
            alert("Veuillez indiquer votre position sur la carte ou utiliser le bouton 'Ma position'.");
            return;
        }

        // Prepare FormData
        const formData = new FormData(e.target);

        try {
            submitBtn.textContent = 'Envoi en cours...';
            submitBtn.disabled = true;

            const response = await fetch('/api/complaints', {
                method: 'POST',
                body: formData // Content-Type is set automatically for FormData
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ ${result.message}\nCode de suivi : ${result.data.code}`);
                e.target.reset();
                document.getElementById('previewArea').innerHTML = '';
                document.getElementById('gpsStatus').textContent = "Position non définie";
                // Reset map marker if needed
            } else {
                throw new Error(result.message || 'Erreur inconnue');
            }

        } catch (error) {
            console.error(error);
            alert(`❌ Erreur : ${error.message}`);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// --- Image Upload Preview ---
function initImageUpload() {
    const fileInput = document.getElementById('photos');
    const previewArea = document.getElementById('previewArea');
    const dropZone = document.getElementById('dropZone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        previewArea.innerHTML = ''; // Clear current previews
        const validFiles = [...files].slice(0, 5); // Limit to 5
        
        validFiles.forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-img');
                previewArea.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}
