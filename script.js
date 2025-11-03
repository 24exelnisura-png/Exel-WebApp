document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen DOM
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const lineWidthInput = document.getElementById('lineWidth');
    const lineWidthValueSpan = document.getElementById('lineWidthValue');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    
    // Penambahan: Dapatkan elemen tombol alat
    const drawButton = document.getElementById('drawButton');
    const eraserButton = document.getElementById('eraserButton');

    // Dapatkan elemen penanda kursor
    const brushPreview = document.getElementById('brushPreview');
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = colorPicker.value; // Simpan warna asli
    let currentTool = 'draw'; // Default tool

    // --- 1. INITIAL SETUP & RESIZING ---

    // Fungsi untuk mengatur ukuran kanvas dan properti
    function resizeCanvasAndSettings() {
        const rect = canvas.parentElement.getBoundingClientRect();
        
        // Menetapkan resolusi internal Canvas agar sesuai dengan ukuran tampilan CSS-nya
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Atur ulang properti menggambar setelah resize (penting!)
        // Gunakan currentTool untuk menentukan strokeStyle dan globalCompositeOperation
        applyToolSettings();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = lineWidthInput.value;
        
        // Inisialisasi brush preview
        updateBrushPreviewStyle();
    }

    // Panggil resize saat halaman dimuat dan ukuran window diubah
    window.addEventListener('load', resizeCanvasAndSettings);
    window.addEventListener('resize', resizeCanvasAndSettings);
    
    // Panggil resize setelah DOM dimuat untuk setup awal
    resizeCanvasAndSettings();

    // --- 2. TOOL MANAGEMENT ---

    // Fungsi untuk menerapkan pengaturan alat (draw/eraser)
    function applyToolSettings() {
        if (currentTool === 'draw') {
            ctx.strokeStyle = currentColor; // Gunakan warna yang dipilih
            ctx.globalCompositeOperation = 'source-over'; // Mode normal untuk menggambar
            brushPreview.style.backgroundColor = currentColor; // Penanda kursor mengikuti warna
            brushPreview.style.border = `2px solid rgba(255, 255, 255, 0.9)`; // Border putih
        } else if (currentTool === 'eraser') {
            ctx.strokeStyle = '#FFFFFF'; // Warna kanvas (putih)
            ctx.globalCompositeOperation = 'destination-out'; // Mode hapus
            brushPreview.style.backgroundColor = '#FFFFFF'; // Penanda kursor menjadi putih
            brushPreview.style.border = `2px solid ${currentColor}`; // Border warna kuas sebelumnya
        }
        updateBrushPreviewStyle(); // Pastikan gaya penanda diperbarui
    }

    // Fungsi untuk mengaktifkan tombol yang dipilih
    function setActiveToolButton(activeButton) {
        drawButton.classList.remove('active');
        eraserButton.classList.remove('active');
        activeButton.classList.add('active');
    }

    // Event listener untuk tombol Draw
    drawButton.addEventListener('click', () => {
        currentTool = 'draw';
        applyToolSettings();
        setActiveToolButton(drawButton);
    });

    // Event listener untuk tombol Eraser
    eraserButton.addEventListener('click', () => {
        currentTool = 'eraser';
        applyToolSettings();
        setActiveToolButton(eraserButton);
    });


    // --- 3. DRAWING LOGIC ---

    // Helper function untuk mendapatkan koordinat yang benar (Touch vs Mouse)
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            // Touch event
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Hitung posisi relatif terhadap kanvas
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }
    
    // Fungsi untuk memperbarui posisi penanda kursor
    function updateBrushPreviewPosition(x, y) {
        // Atur posisi relatif terhadap container <main>
        // Menggunakan translate() untuk performa yang lebih baik
        brushPreview.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Fungsi untuk memperbarui gaya penanda kursor (warna & ukuran)
    function updateBrushPreviewStyle() {
        const size = `${lineWidthInput.value}px`;
        brushPreview.style.width = size;
        brushPreview.style.height = size;
        // Warna dan border diatur di applyToolSettings()
    }

    // Event handler untuk menampilkan/menyembunyikan penanda kursor
    canvas.addEventListener('mouseenter', () => brushPreview.style.display = 'block');
    canvas.addEventListener('mouseleave', () => brushPreview.style.display = 'none');


    function draw(e) {
        // Mencegah scrolling pada perangkat sentuh (touchmove)
        if (e.touches) {
             e.preventDefault();
        }

        // Menggunakan helper function untuk koordinat yang akurat
        const { x: currentX, y: currentY } = getCoords(e);
        
        // Pindahkan penanda kursor
        updateBrushPreviewPosition(currentX, currentY);


        if (!isDrawing) return;

        // Proses menggambar: Lanjutkan dari posisi terakhir
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Update posisi terakhir
        lastX = currentX;
        lastY = currentY;
    }

    function handleStart(e) {
        // Untuk touch events, kita tetap perlu preventDefault
        if (e.touches) {
            e.preventDefault();
        }
        
        isDrawing = true;
        
        // Menggunakan helper function untuk koordinat yang akurat
        const { x: startX, y: startY } = getCoords(e);
        
        // Pastikan penanda kursor berada di posisi start
        updateBrushPreviewPosition(startX, startY);

        lastX = startX;
        lastY = startY;
        
        // FIX: Mulai path baru dan pindah ke titik awal secara eksplisit
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function handleEnd() {
        isDrawing = false;
    }

    // --- 4. EVENT LISTENERS ---

    // Event Mouse
    // Menambahkan preventDefault pada mousedown dan mousemove untuk mencegah teks selection
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', handleEnd); 

    // Event Sentuhan (Touch)
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', draw);
    window.addEventListener('touchend', handleEnd);

    // Color Picker Listener
    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value; // Simpan warna baru
        // Jika dalam mode draw, langsung terapkan warna baru
        if (currentTool === 'draw') {
            applyToolSettings();
        }
        // Penanda kursor akan diperbarui melalui applyToolSettings()
    });

    // Line Width Listener
    lineWidthInput.addEventListener('input', (e) => {
        ctx.lineWidth = e.target.value;
        lineWidthValueSpan.textContent = e.target.value;
        // Penanda kursor akan diperbarui melalui updateBrushPreviewStyle()
        updateBrushPreviewStyle();
    });

    // --- 5. ACTION BUTTONS ---

    // Hapus Kanvas
    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Simpan Gambar
    saveButton.addEventListener('click', () => {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'mini_artist_artwork.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Inisialisasi awal tombol Draw sebagai aktif
    setActiveToolButton(drawButton);
});
