(function(automate) {

    var scene, camera, renderer, controls, building;

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
    };

    var animate = function () {
        requestAnimationFrame(animate);
        controls.update();
    };

    var render = function() {
        renderer.render(scene, camera);
    };

    var sensorTicker = function() {
		$.get('/current', function(json) {
			$.each(json.current, function(serial, temp) {
				// TODO: Update sensor values
			});
		});
		setTimeout(function() {
		    sensorTicker();
		}, 15000);
    };

    automate.loadBuilding = function (modelpath, zdepth) {
        init(modelpath, zdepth);
        animate();
    };

	automate.loadTelemetry = function() {
	    sensorTicker();
	};

}( window.automate = window.automate || {}, automate));
