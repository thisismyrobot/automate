(function(automate) {

    var scene, camera, renderer, controls, building, projector;
    var sensors = {};

    var init = function (modelpath, zdepth) {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75,
            window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = zdepth;
        camera.position.y = 4;
        camera.rotation.x = -0.4;

        controls = new THREE.OrbitControls(camera);
        controls.damping = 0.2;
        controls.addEventListener('change', render);

        var mat_wf_fill = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            opacity: 0.25,
        });
        var manager = new THREE.LoadingManager();
        var loader = new THREE.OBJLoader(manager);
        loader.load(modelpath, function(modelObj) {
            building = modelObj;
            modelObj.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    var mesh = new THREE.EdgesHelper(child, 0x00ff00);
                    mesh.material.linewidth = 1;
                    mesh.material.opacity = 0.75;
                    scene.add(mesh);
                    var meshclone = new THREE.Mesh(child.geometry, mat_wf_fill);
                    scene.add(meshclone);
                }
            });
            render();
        });

        projector = new THREE.Projector();
        renderer = new THREE.CanvasRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    };

    var animate = function () {
        placeSensors();
        requestAnimationFrame(animate);
        controls.update();
    };

    var render = function() {
        renderer.render(scene, camera);
    };

    var sensorUpdater = function() {
        $.get('/current', function(json) {
            $.each(json.current, function(serial, temp) {
                $('#sensor__' + serial).text(temp);
            });
        });
        setTimeout(function() {
            sensorUpdater();
        }, 15000);
    };

    // Places 2d div over 3d sensor
    // http://zachberry.com/blog/tracking-3d-objects-in-2d-with-three-js/
    var placeSensors = function() {
        // Find the 2d position of the sensor text on the 3d canvas, move the
        // sensor text there.
        var z_pos = {};
        $.each(sensors, function(id, mesh) {
            var p = new THREE.Vector3();
            p.setFromMatrixPosition(mesh.matrixWorld);
            var v = projector.projectVector(p, camera);
            var percX = (v.x + 1) / 2;
            var percY = (-v.y + 1) / 2;
            var left = percX * window.innerWidth;
            var top = percY * window.innerHeight;
            $('#sensor__' + id).css({
                left: left + 'px',
                top: top + 'px',
            });
            z_pos[id] = p.z;
        });
        // Set the Z-index to match which sensor(s) are in front of others.
        var sensor_ids = Object.keys(sensors);
        sensor_ids.sort(function(a, b) {
            return z_pos[b] - z_pos[a];
        });
        $.each(sensor_ids, function(zindex, id) {
            $('#sensor__' + id).css('z-index', zindex);
        });
    };

    var loadSensors = function() {
        $.get('/sensors', function(json) {
            $.each(json.sensors, function(title, data) {
                $('body').append('<div id="sensor__' + data.id + '">test</div>');
                var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.1, 1, 1), new THREE.MeshNormalMaterial());
                sphere.position.x = data.x;
                sphere.position.y = data.y;
                sphere.position.z = data.z;
                scene.add(sphere);
                sensors[data.id] = sphere;
            });
            render();
        });
    };

    automate.loadBuilding = function (modelpath, zdepth) {
        init(modelpath, zdepth);
        animate();
    };

    automate.loadTelemetry = function() {
        loadSensors();
        sensorUpdater();
    };

}( window.automate = window.automate || {}, automate));
