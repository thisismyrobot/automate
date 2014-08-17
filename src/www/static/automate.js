(function(automate) {

    var scene, camera, renderer, controls, building;

    var sensors = {};

    var mat_sensor = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.75,
    });

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

        renderer = new THREE.CanvasRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        renderTelemetry();
    };

    var animate = function () {
        requestAnimationFrame(animate);
        controls.update();
    };

    var render = function() {
        renderer.render(scene, camera);
    };

    var renderTelemetry = function() {
        var ajaxTicker = function() {
            $.get('/current', function(json) {
                $.each(json.current, function(id, value) {
//                    console.log(sensors[id].mesh.material.map);
//                    console.log(id, value);
                });
                render();
            });
        }
        setInterval(function() {
            ajaxTicker();
        }, 1000);
    }


    var toScreenXY = function ( position, camera, jqdiv ) {

        var pos = position.clone();
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiply( camera.projectionMatrix, camera.matrixWorldInverse );
        projScreenMat.multiplyVector3( pos );

        return { x: ( pos.x + 1 ) * jqdiv.width() / 2 + jqdiv.offset().left,
             y: ( - pos.y + 1) * jqdiv.height() / 2 + jqdiv.offset().top };

    }


    var registorSensor = function(sensor) {

        var sensorMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            mat_sensor
        );
        sensorMesh.position.x = sensor.config.x;
        sensorMesh.position.y = sensor.config.y;
        sensorMesh.position.z = sensor.config.z;
        scene.add(sensorMesh);
        sensor.mesh = sensorMesh;
        sensors[sensor.config.id] = {
            title: sensor.title,
            mesh: sensorMesh,
        };
    }

    automate.loadBuilding = function (modelpath, zdepth) {
        init(modelpath, zdepth);
        animate();
    };

    automate.addSensors = function() {
        $.get('/sensors', function(json) {
            $.each(json.sensors, function(title, config) {
                registorSensor({
                    title: title,
                    config: config,
                });
            });
        });
    };

}( window.automate = window.automate || {}, automate));
