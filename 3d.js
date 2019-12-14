window.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById('glcontext');
    var engine = new BABYLON.Engine(canvas, true);

    var createScene = function () {
        // basic scene
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0,0,0,0);

        var helper = scene.createDefaultEnvironment({
            createSkybox: false
        });
        helper.setMainColor(BABYLON.Color3.Black());

        // physics, longhand
        // var gravityVector = new BABYLON.Vector3(0,-6.81, 0);
        // var physicsPlugin = new BABYLON.CannonJSPlugin();
        // scene.enablePhysics(gravityVector, physicsPlugin);
        // physics, shorthand
        scene.enablePhysics();

        // glow
        var gl = new BABYLON.GlowLayer("glow", scene);
        gl.intensity = 0.5;

        //Ground
        var ground = BABYLON.Mesh.CreatePlane("ground", 200.0, scene);
        ground.material = new BABYLON.StandardMaterial("groundMat", scene);
        ground.material.diffuseColor = new BABYLON.Color4(1, 1, 1, 0);
        ground.material.backFaceCulling = false;
        ground.position = new BABYLON.Vector3(0, 0.1, 0);
        ground.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);

        // camera/player STUFF
        // create camera
        var camera = new BABYLON.UniversalCamera('view',
            new BABYLON.Vector3(-10, 2.1, 10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        
        // basic lighting
        var light1 = new BABYLON.PointLight('point1', new BABYLON.Vector3(6, 10, -8), scene);


        function makeUfffdBoxes(num = 1) {
            for (let i = 0; i < num; i++) {
                var box = BABYLON.Mesh.CreateBox('Box'+i, Math.random() * 0.5, scene);
                box.position.y += Math.random() + 6;
                box.position.z += 0.5 - Math.random();
                box.position.z += 0.5 - Math.random();
                box.rotation.x -= Math.random();
                box.rotation.z -= Math.random();

                // ufffd_cube_mat, ufffd cubes
                var ufffd_cube_mat = new BABYLON.StandardMaterial('ufffd_cube_mat', scene);
                ufffd_cube_mat.diffuseColor = BABYLON.Color3.White();
                ufffd_cube_mat.diffuseTexture = new BABYLON.Texture("img/logo/ufffd-3_in_sq-slapper-introverted.png", scene);
                ufffd_cube_mat.emissiveTexture = new BABYLON.Texture("img/logo/ufffd-3_in_sq-slapper.png", scene);
                ufffd_cube_mat.bumpTexture = new BABYLON.Texture("img/logo/ufffd-3_in_sq-slapper_bump.png", scene);
                ufffd_cube_mat.roughness = -0.5;

                box.material = ufffd_cube_mat;

                box.actionManager = new BABYLON.ActionManager(scene);

                box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    function (evt) {
                        console.log(evt.meshUnderPointer.name);
                        var newsize = Math.random() * 2 + 1;
                        scene.getMeshByName(evt.meshUnderPointer.name).scaling = new BABYLON.Vector3(newsize, newsize, newsize);
                    }
                ));

                box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, {
                    mass: 2,
                    restitution: 0.55
                }, scene);
            }
        }
        // makeUfffdBoxes(16);


        // Enable Collisions
        // scene.collisionsEnabled = true;
        camera.checkCollisions = true;
        // check collisions
        ground.checkCollisions = true;
        // box.checkCollisions = true;


        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
            restitution: 0.9
        }, scene);
        // camera.physicsImpostor = new BABYLON.PhysicsImpostor(camera, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);


        // Create default pipeline and enable dof with Medium blur level
        var pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [scene.activeCamera]);
        pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Medium;
        pipeline.depthOfFieldEnabled = true;
        pipeline.depthOfField.focalLength = 50;
        pipeline.depthOfField.fStop = 10;
        pipeline.depthOfField.focusDistance = 2250;


        scene.registerBeforeRender(function () {
            engine.resize()
        })


        // start the scene!
        return scene;
    }

    var scene = createScene();

    engine.runRenderLoop(function () {
        // render changes
        scene.render();
    })

});