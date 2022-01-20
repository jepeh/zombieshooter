import * as Three from '../src/three.js'
import { RoundedBoxGeometry } from '../src/RoundedBoxGeometry.js'
import { OrbitControls } from '../src/OrbitControls.js'
import { JoyStick } from '../controller/joy.js'
import { CharacterControls } from '../controller/controller.js'
import * as Character from '../characters/character.js'
import { Profile, Levels, Sounds, User } from '../profiles/profile.js'
import { OimoPhysics } from '../src/OimoPhysics.js'
import { drawMap } from '../app/map/map.js'
import * as Utils from './utils.js'
import * as Sound from './audio.js'
import { GLTFLoader } from '../src/Loader/GLTFLoader.js'
import Skills from '../skills/skills.js'

// Composer & RenderPass
//import * as Composer from '../src/Composer/EffectComposer.js'
//import {RenderPass} from '../src/Composer/RenderPass.js'

// Shader
//import {UnrealBloomPass} from '../src/Composer/shaders/UnrealBloomPass.js'


var GAME;

$("#GameMode").css("display", "grid")
var Game = (function(w, func) {

	// Check if browser support WebGL
	if (w) {
		// morph window device pixel ratio
		window.devicePixelRatio = 2

		$("#alert").css("display", "block")
		FBInstant.initializeAsync()
			.then(() => {
				var loaded = 1;
				var loading = setInterval(() => {
					if (loaded >= 100) {
						clearInterval(loading)
					}
					else {
						loaded++
					}

					FBInstant.setLoadingProgress(loaded)
				}, 100)

				FBInstant.startGameAsync()
					.then(() => {


						console.log("Game Started!")
						// Get Player User Data
						User.id = FBInstant.player.getID();
						User.name = FBInstant.player.getName();
						User.image.crossOrigin = 'anonymous';
						User.image.src = FBInstant.player.getPhoto();
						User.locale = FBInstant.getLocale();
						User.platform = FBInstant.getPlatform()

						// Save Initial Data
						FBInstant.player.getDataAsync(["level", "heroName", "coins", "rank", "maxHP", "bombDamage", "energy", "mapRadius", "atomBombRadius", "gunRange", "keys", "skills", "Heroes", "countdownMin"])
							.then(data => {

								if (data["level"] === undefined) {

									console.log("Player is new")
									FBInstant.player.setDataAsync({
										level: Profile.level,
										heroName: Profile.heroName,
										coins: Profile.coins,
										rank: Profile.rank,
										maxHP: Profile.maxHP,
										bombDamage: Profile.bombDamage,
										energy: Profile.energy,
										mapRadius: Profile.mapRadius,
										atomBombRadius: Profile.atomBombRadius,
										gunRange: Profile.gunRange,
										countdownMin: Profile.countdownMin,
										keys: Profile.keys,
										skills: [{
											name: "forceField",
											damage: 3,
											img: "assets/images/textures/field.png"
	}, {
											name: "laserBeam",
											damage: 0.8, // scaling down targets to 80%
											img: "assets/images/textures/gun.png"
	}],
										Heroes: [
											{
												name: "cube",
												heroClass: "default",
												premium: false,
												unlockable: false
		}
		]
									}).then(() => {
										console.log("Data Set!")
									}).catch(e => {
										console.warn(e)
									})
								} else {

									// Old Players
									Profile.level = data["level"]
									Profile.heroName = data["heroName"]
									Profile.coins = data["coins"]
									Profile.rank = data["rank"]
									Profile.maxHP = data["maxHP"]
									Profile.bombDamage = data["bombDamage"]
									Profile.energy = data["energy"]
									Profile.mapRadius = data["mapRadius"]
									Profile.atomBombRadius = data["atomBombRadius"]
									Profile.keys = data["keys"]
									Profile.gunRange = data["gunRange"]
									Profile.skills = data["skills"]
									Profile.countdownMin = data["countdownMin"]
									Profile.Heroes = data["Heroes"]

									console.log("Data fetched!")
								}

							}).catch((e) => {
								console.warn(e)

							})
						// Fetch FB Data End

						//	play Game	
						play(FBInstant)
						// FB start Game End

					})
					.catch(e => {
						// FB Start Game Async Error
						console.log(e)
					})

				// FB Initialize end
			})
			.catch(e => {
				// FB Initiwlize Async error
				console.log(e)
			})

		// Fetch or Save FB Player Data

		//play(true)


		function play(FB) {
			$("body").append(`<img id="splash" src="assets/images/blockgameswhite.png"/>`)
			$("body").css({ background: 'white', transition: 'all 2s' })
			var bb = setTimeout(() => {
				$("#splash").attr("src", "assets/images/blockgamesblack.png")
				$('body').css("background", "black")


				var bbb = setTimeout(() => {
					$("#splash").remove()
					$("body").append(`<img id="logo" src="assets/images/logo.png" />`)

					var ho = setTimeout(() => {
						clearTimeout(ho)
						$("#logo").remove()
						$("body").css('background', "#191C25")
						func(FB)
					}, 1300)


					clearTimeout(bbb)
				}, 1900)


				clearTimeout(bb)
			}, 1800)

		}

	}

})(window || this, function(Facebook) {

	var world = OimoPhysics().then(phys => {

		$("#loader").css('display', 'none')
		// RETRIEVE FACEBOOK PLAYER GAME DATA	

		// RETRIEVE FACEBOOK PLAYER GAME DATA	

		// MUSIC AND SOUND
		Sounds.sound ? $("#sound div").css({ transform: "translateX(-63%)", backgroundColor: "rgba(255,255,255,.7)" }) : $("#sound div").css({ transform: "translateX(63%)", backgroundColor: "rgba(0,0,0,.7)" });
		!Sounds.sound ? $("#sound").css({ backgroundColor: "rgba(255,255,255,.8)" }) : $("#sound").css({ backgroundColor: "rgba(0,0,0,.4)" })
		Sounds.sound ? Sounds.sound = false : Sounds.sound = true

		Sounds.music ? $("#music div").css({ transform: "translateX(-63%)", backgroundColor: "rgba(255,255,255,.7)" }) : $("#music div").css({ transform: "translateX(63%)", backgroundColor: "rgba(0,0,0,.7)" });
		!Sounds.music ? $("#music").css({ backgroundColor: "rgba(255,255,255,.8)" }) : $("#music").css({ backgroundColor: "rgba(0,0,0,.4)" })
		Sounds.music ? Sounds.music = false : Sounds.music = true

		var Obj = Object.create(null)

		// For Later resizing of browser
		var sizes = {
			width: window.innerWidth,
			height: window.innerHeight
		}


		var CANVAS = document.getElementById('webgl')


		//ThreeJS window Variables
		window.SCENE = new Three.Scene()
		window.CAMERA = new Three.PerspectiveCamera(45, sizes.width / sizes.height, 1, 4000)
		window.CLOCK = new Three.Clock()
		window.RENDERER = new Three.WebGLRenderer({
			canvas: CANVAS,
			antialias: true,
			alpha: true
		})


		window.CONTROLS = new OrbitControls(CAMERA, RENDERER.domElement)
		CONTROLS.enabled = true
		CONTROLS.enablePan = false
		CONTROLS.enableZoom = false
		CONTROLS.minPolarAngle = -Math.PI / 4;
		CONTROLS.maxPolarAngle = Math.PI / 3;

		CLOCK.autoStart = false
		CLOCK.startTime = 0
		CLOCK.elapsedTime = 0
		CLOCK.start()

		// dynamic variables
		window.keyPressed = ""
		window.droppedBomb = []
		window.droppedCoins = []
		window.inGame = false
		window.firstS = true
		window.secondS = true
		window.addRewards = []
		window.mysteryboxes = []

		CAMERA.layers.enable(0)

		/************ FUNCTIONS START************/
		document.documentElement.style.setProperty('--width', innerWidth / 2 + "px")
		document.documentElement.style.setProperty('--height', innerHeight / 2 + "px")

			! function() {
				$('#Chart').easyPieChart({
					size: 50,
					barColor: "#40F0FFD4",
					scaleLength: 1,
					lineWidth: 3,
					trackColor: "#525151",
					lineCap: "circle",
					animate: 1000,
				});

			}()

		// display logo
		$("#coin-container, #energy-container, #settings, #coin-container").css('display', 'grid')

		// initiate Level array

		function generateLevels() {
			var cnt = 0;
			do {
				cnt++;
				Levels.levels.push({
					level: cnt,
					enemy: cnt > 10 ? cnt > 30 ? 80 : 50 : 30
				})
			} while (cnt <= 50)
		}
		generateLevels()

		// FACEBOOK DATA UPDATE

		// Update Profile Names, Images
		$("#Profile-src").attr("src", User.image.src)
		$("#ProfileInfo-Name").text(User.name)
		$("#gameid").text("Game ID: " + User.id)
		$("#ProfileInfo-Rank").text("Rank: " + Profile.rank)

		// FACEBOOK DATA UPDATE
		//*******************************************%

		function resize() {

			sizes.width = window.innerWidth
			sizes.height = window.innerHeight

			CAMERA.aspect = sizes.width / sizes.height
			CAMERA.updateProjectionMatrix()

			RENDERER.setSize(sizes.width, sizes.height);
			RENDERER.setPixelRatio(window.devicePixelRatio)
			RENDERER.shadowMap.enabled = true

			RENDERER.render(SCENE, CAMERA)

			return false
		}

		Obj.resize = resize

		window.addEventListener('resize', () => {
			Obj.resize()
		})

		/*************FUNCTIONS END**************/


		RENDERER.setSize(sizes.width, sizes.height);
		RENDERER.setPixelRatio(window.devicePixelRatio)
		RENDERER.shadowMap.enabled = true
		CAMERA.position.set(0, 25, 20)

		// Lights and Shadow

		const ambLight = new Three.AmbientLight('white', .6)
		const dirLight = new Three.DirectionalLight('white', .3)


		dirLight.position.set(0, 100, -100)
		dirLight.castShadow = true
		dirLight.shadow.mapSize.width = 1024 * 2
		dirLight.shadow.mapSize.height = 1024 * 2



		window.loader = new GLTFLoader()
		window.TextureLoader = new Three.TextureLoader()

		var d = 200

		dirLight.shadow.camera.left = -d
		dirLight.shadow.camera.right = d
		dirLight.shadow.camera.top = d
		dirLight.shadow.camera.bottom = -d
		dirLight.shadow.camera.far = 1000
		dirLight.shadow.camera.near = 1


		SCENE.add(dirLight, ambLight)

		// Add ambient and dirlight in the scene


		/**************************************************
		Update Game Modes
		**************************************************/
		var modes = document.getElementById("GMDiv")

		for (var va = 0; va < modes.children.length - 1; va++) {
			if (modes.children[va].attributes.status.value === "locked") {
				modes.children[va].style.backgroundImage = "url(assets/images/lockmode.png)"
			}

		}

		/**************************************************
		PLAY GAME MODES
		**************************************************/
		$(".GMDivs").on("click", (e) => {
			switch (e.currentTarget.attributes.stage.value) {
				case "farming":
					Utils.isEnergy() ? startAnim(Profile.level) : Utils.notEnergy()
					break;
				default:
			}
		})


		//*******************************************	
		//Update  Personal Game Data
		//*******************************************
		// energy
		$("#energy-txt").text("x" + Profile.energy)
		$("#coin-txt").text(Profile.coins)

		// floor
		const floor = new Three.Mesh(new Three.BoxGeometry(305, 1, 305), new Three.MeshToonMaterial({ color: "#191C25" }))
		floor.position.y = -1
		floor.castShadow = true
		floor.receiveShadow = true

		SCENE.add(floor)

		const border = new Three.Mesh(new Three.RingGeometry(305, 306, 4), new Three.MeshToonMaterial({ color: "red", side: Three.DoubleSide }))
		border.position.y = 1
		border.rotation.x = Math.PI / 2
		border.rotation.z = Math.PI / 4
		SCENE.add(border)

		/*	const renderScene = new RenderPass(SCENE, CAMERA)

			const bloomPass = new UnrealBloomPass(new Three.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
			// bloomPass.renderToScreen = true;
			bloomPass.renderToScreen = true;
			bloomPass.threshold = 0;
			bloomPass.strength = 2;
			bloomPass.radius = 0;

			var composer = new Composer.EffectComposer(RENDERER)
			composer.renderToScreen = false
			composer.setSize(innerWidth, innerHeight);
			composer.addPass(renderScene);
			composer.addPass(bloomPass)

			composer.render()

			RENDERER.autoClear = false
			CAMERA.layers.enable(1)
			
			var m = new Three.Mesh(new Three.BoxGeometry(1,1,1), new Three.MeshToonMaterial())
			m.position.x = 3
			m.layers.set(1)
			SCENE.add(m)*/

		const pLight = new Three.PointLight("#01F0FF", 1, 20)

		pLight.position.set(0, 1.5, 0)
		pLight.shadow.mapSize.width = 1024 * 2
		pLight.shadow.mapSize.height = 1024 * 2
		pLight.shadow.radius = 8
		SCENE.add(pLight)

		// render hero
		window.hero = makeHero()


		function makeHero() {
			var hero;
			switch (Profile.heroName) {
				case "cube":
					hero = new Character.Heroes.defaultHero();
					break;
			}
			return hero;
		}

		function ch() {

			window.character = hero.renderHero()
			character.name = Profile.heroName
			character.position.set(0, 2.5, 0)
			character.receiveShadow = true
			character.scale.set(.1, .1, .1)
			character.rotation.y = -10
			CAMERA.position.set(0, 20, 20)
			CAMERA.lookAt(character.position)
			SCENE.add(window.character)
		}

		ch()

		var mm = [
			new Three.MeshToonMaterial({ transparent: true }),
			new Three.MeshToonMaterial({ transparent: true, opacity: 0 }),
			new Three.MeshToonMaterial({ transparent: true, opacity: 0 })
			]

		var mp = TextureLoader.load('assets/images/textures/field.png')
		mm[0].map = mp
		mm[0].side = 2

		var cu = new Three.Mesh(new Three.CylinderGeometry(4, 4, 4, 50, 60), mm)
		cu.position.set(0, 4, 0)

		SCENE.add(cu)



		window.gunrange = new Three.Mesh(new Three.CylinderGeometry(hero.gunRange, hero.gunRange, .08, 30), new Three.MeshToonMaterial())
		gunrange.material.transparent = true
		gunrange.material.opacity = 0
		gunrange.position.copy(character.position)
		gunrange.position.y = -2
		SCENE.add(gunrange)

		var fog = new Three.Fog("black", 70, 100)
		SCENE.fog = fog

		TweenMax.to(character.scale, .9, {
			x: 1,
			y: 1,
			z: 1,
			easing: Power2.easingIn,
			onComplete: function() {
				$("#playbtn").css("display", "grid")
			}
		})
		TweenMax.to(cu.position, 1.2, {
			x: 0,
			y: -1.3,
			z: 0,
			easing: Power2.easingIn,
			onComplete: function() {
				$("#playbtn").css("display", "grid")
			}
		})

		//*******************************************
		// Change Color 
		//*******************************************
		window.colors = ["orange", "blue", "violet", "yellow", "white", "pink"]

		/*
		***********************************************
		MAIN GAME
		***********************************************
		*/


		var grp = new Three.Group()
		var mk = TextureLoader.load("assets/images/textures/rod.png")


		window.enemyList = []
		window.enemies = []
		window.bloods = []

		function notif(txt) {
			$("#status").css("display", "block")
			$("#status").text(txt)

			var ggg = setTimeout(() => {
				$("#status").css("display", "none")
				clearTimeout(ggg)
			}, 3400)
		}

		Obj.notif = notif

		// joystick
		window.joy = new JoyStick("joystick", {
			width: 130,
			height: 130
		})


		// animation game
		function startAnim(lvl) {

			CONTROLS.enabled = false
			$("#cover, #GameMode, #playbtn, #logo, #settings, #energy-container, #coin-container, #version, #trademark")
				.css("display", "none")
			character.position.set(0, 2.5, 0)

			var tarPos = new Three.Vector3(25, 70, 25)

			hero.initAnim()

			$("#status").text("preparing the field...")
			$("#status, #statusbar").css("display", "block")
			var oo = setTimeout(() => {
				$("#status").text("initiating zombies...")
				clearTimeout(oo)
			}, 2000)

			var nm = 0;

			TweenMax.to(CAMERA.position, 4, {
				x: tarPos.x,
				y: tarPos.y,
				z: tarPos.z,
				easing: Power2.easingIn,
				onUpdate: function() {
					CAMERA.lookAt(character.position)
					nm = nm + .8
					if (nm > 100) {} else {
						$("#bar").css("width", nm + "%")
					}
				},
				onComplete: function() {
					nm = 0
					CAMERA.lookAt(character.position)
					// Start game
					$("#status").text("initiation completed!")
					var str = setTimeout(function() {
						startGame(lvl)
						clearTimeout(str)
						CONTROLS.target = character.position
						// Fetch GLTF assets
					}, 700)
				}
			})

			return;
		}

		// initial animation
		//RENDERER.autoClear = false
		function Anim() {

			window.initAnim = function() {
				var now = Date.now() / 400


				var elapsedTime = CLOCK.getElapsedTime()
				//character.rotation.y = Math.cos(elapsedTime) * .2
				hero.anim(elapsedTime)
				cu.rotation.y = elapsedTime
				//	render layer0 boom
				//	RENDERER.clear()
				//	CAMERA.layers.set(1)
				//	composer.render()

				//render layer1 normal
				//	RENDERER.clearDepth()
				//	CAMERA.layers.set(0)
				RENDERER.render(SCENE, CAMERA)

				if (typeof Obj.initAnim === "function") {
					requestAnimationFrame(Obj.initAnim)
				}

				return;
			}

			Obj.initAnim = initAnim
			Obj.initAnim()


			return;
		}
		Anim()


		function startGame(lvl) {
			// stop animation
			Obj.initAnim = undefined
			Obj.initanim = undefined
			//console.log(document.getElementById('webgl'))

			// update cgart atombomb
			$('.chart').data('easyPieChart').update(Profile.atomLevel)

			// light

			Profile.playGame = true

			// decrease energy
			Profile.energy = Profile.energy - 2


			// inGame session
			window.inGame = true

			pLight.position.set(0, pLight.position.y, 0)

			// reset hero's life stat
			hero.hp.style.width = "100%"
			$("#lifecount").text("life " + Math.floor(hero.hpLeft) + "/100")
			$("#speed").text("speed " + Math.floor(hero.velocity * 100 / Profile.velocity) + "%")


			// display stats
			$("#statcount, #tips, #life, #bombbar, #counter, #utils, #mapicon").css("display", "grid")
			$("#joystick")
				.css("opacity", "1")
			$("#atombomb").css("display", "block")


			// hide elements
			$("#status, #statusbar")
				.css("display", "none")

			$("#coinstxt").text("coins x" + hero.coins)

			//*******************************************
			//	update skills
			//*******************************************	

			function updateSkills() {
				for (var i = 0; i < Profile.skills.length; i++) {
					$(`#Skill${i+1}`).append(`<img class="skillImg" src="${Profile.skills[i].img}"/>`)
					$(`#Skill${i+1}`).attr("name", Profile.skills[i].name)

				}
				return;
			}
			updateSkills()

			// show map
			$("#mapicon").on('touchstart', function() {
				$("#map").css("display", "block")
			})
			$("#mapicon").on('touchend', function() {
				$("#map").css("display", "none")
			})


			/***************************************************
			Physics World 
			**************************************************/

			// Fog

			var tp = setTimeout(() => {
				$("#tips").css({ width: "0%", left: "50%", marginLeft: "-0%" })
				clearTimeout(tp)
			}, 4000)


			phys.addMesh(floor, 0)

			// Generate Enemies
			for (var i = 0; i < Levels.levels[lvl].enemy; i++) {
				var x = Math.floor(Math.random() * (100 - (-100)) + (-100))
				var z = Math.floor(Math.random() * (100 - (-100)) + (-100))
				var size = Math.floor(Math.random() * (8 - 4) + 4)

				var enemy = new Character.Enemy({ x: x, y: size / 2, z: z }, 'green', {
					w: size,
					h: size,
					d: size
				}, Math.random() * .2 - .09, Math.random() * .2 - .09, SCENE, CAMERA, RENDERER, i, phys)

				var mesh = enemy.renderEnemy()
				// name the mesh by iterated variable i

				window.enemyList.push(mesh)
				window.enemies.push(enemy)
				phys.addMesh(mesh, 1)
				SCENE.add(mesh)
			}

			// atomBomb
			window.bmb = true

			var bomb = document.getElementById('bomb')

			if ("ontouchstart" in document.documentElement) {
				document.getElementById("atombomb").addEventListener('touchstart', () => {

					if (Profile.atomLevel >= 100 && bmb) {
						bmb = false
						window.atom = new Utils.Atom(SCENE, phys, enemyList)
						window.a = atom.show()
						window.atomBomb = true
						SCENE.add(window.a)
					} else {

					}
				})

				// Default Bomb
				bomb.addEventListener('touchstart', () => {
					hero.bomb()
				})

				$("#Skill1").on("touchstart", () => {
					firstSkill()

				})
				$("#Skill2").on("touchstart", () => {
					secondSkill()
				})
			}

			var mmm = [
			new Three.MeshToonMaterial({ transparent: true }),
			new Three.MeshToonMaterial({ transparent: true, opacity: 0 }),
			new Three.MeshToonMaterial({ transparent: true, opacity: 0 })
			]

			// Random Hexagons
			var mk = TextureLoader.load("assets/images/textures/rod.png")

			mmm[0].map = mk
			mmm[1].color.set("green")
			mmm[1].opacity = .4

			for (var uu = 0; uu < 25; uu++) {
				var posx = Math.floor(Math.random() * (150 - (-150)) + (-150))
				var posz = Math.floor(Math.random() * (150 - (-150)) + (-150))
				var grp = new Three.Group()

				for (var u = 0; u < 10; u++) {
					var size = Math.floor(Math.random() * (3 - 1) + 1)
					var height = Math.random() * (1 - .3) + .3
					var posX = Math.floor(Math.random() * (6 - (-6)) + (-6))
					var posZ = Math.floor(Math.random() * (6 - (-6)) + (-6))

					var kyub = new Three.Mesh(new Three.CylinderGeometry(size, size, height, 6), mmm)
					if (u >= 1) {
						kyub.position.set(posX, 1, posZ)
					} else {
						kyub.position.set(0, 1, 0)
					}
					grp.add(kyub)
				}

				SCENE.add(grp)
				grp.position.set(posx, 0, posz)

			}


			var fReloaded = 100,
				sReloaded = 100;

			function firstSkill() {
				if (firstS) {
					if (fReloaded >= 100) {
						var skillname = $("#Skill1").attr("name")

						for (var s = 0; s < Skills.length; s++) {
							if (skillname === Skills[s].name) {
								Skills[s].func(phys)
								fReloaded = 0
								$("#Skill1 img").css({
									opacity: .3
								})

								var r = 1;
								var rel = setInterval(() => {
									if (r > 100) {
										fReloaded = 100
										$("#Skill1 div").css({
											top: "100%",
											height: "0%",
											opacity: 0

										})
										$("#Skill1 img").css({
											opacity: 1
										})
										clearInterval(rel)
									} else {
										r++
										$("#Skill1 div").css({
											height: r + "%",
											top: 100 - r + "%",
											opacity: 1
										})
									}
								}, 350);
							}
						}
					}

				}

				return;
			}

			function secondSkill() {
				if (secondS) {
					if (sReloaded >= 100) {
						var skillname = $("#Skill2").attr("name")

						for (var s = 0; s < Skills.length; s++) {
							if (skillname === Skills[s].name) {
								Skills[s].func()
								sReloaded = 0
								$("#Skill2 img").css({
									opacity: .3
								})

								var r = 1;
								var rel = setInterval(() => {
									if (r > 100) {
										sReloaded = 100
										$("#Skill2 div").css({
											top: "100%",
											height: "0%",
											opacity: 0

										})
										$("#Skill2 img").css({
											opacity: 1
										})
										clearInterval(rel)
									} else {
										r++
										$("#Skill2 div").css({
											height: r + "%",
											top: 100 - r + "%",
											opacity: 1
										})
									}
								}, 10);
							}
						}
					}

				}

				return;
			}

			//*******************************************
			// COUNTER
			//**************************************************

			window.particles = [];
			window.killed = 0
			window.gobo = true

			var seconds = Profile.countdownMin * 60

			var counter = setInterval(() => {

				// decrease counter by 1 second
				seconds--
				$("#seconds").text(seconds + " s")

				if (seconds < 0) Obj.gameOver();

			}, 1000)

			var boxesTime = Profile.level > 10 ? Profile.level > 30 ? 12000 : 18000 : 20000
			var boxes = setInterval(() => {
				Utils.spawnBox()
			}, boxesTime)

			Obj.boxes = boxes
			Obj.counter = counter

			//update zombie count
			$("#zombiecount p").html("Zombies x" + enemies.length)

			/**************************************************
			Character Controls
			**************************************************/
			var CHARCONTROLS = new CharacterControls(SCENE, window.character, CONTROLS, CAMERA)

			// Initial Render
			RENDERER.render(SCENE, CAMERA)

			// LOOP FUNCTION
			window.loop = function() {
				// animate map
				drawMap(enemies)
				var delta = CLOCK.getDelta()
				//	window.atom === undefined ? true : window.atom.update(delta)
				CONTROLS.update()
				CHARCONTROLS.update(delta, keyPressed, pLight, window.isFiring)

				for (var i = 0; i < enemies.length; i++) {
					// Update enemies walking and hero detection
					enemies[i].update(phys, delta, character, enemyList)
				}

				//update bombs
				var tt = CLOCK.getElapsedTime()
				cu.rotation.y = tt * 1.6
				if (window.atomBomb) {
					window.atom.update(tt)
				}

				// first skill anim
				if (window.shieldOn) {
					hero.shield.rotation.y = Math.sin(tt) * 1.5
					hero.shield.rotation.x = -Math.cos(tt) * 1.5
					//hero.shield.position.copy(hero.mesh.position)
					phys.setMeshPosition(hero.shield, {
						x: hero.mesh.position.x,
						y: 4,
						z: hero.mesh.position.z
					})
				}


				for (var i = 0; i < window.mysteryboxes.length; i++) {
					//	mysteryboxes[i].position.y = -Math.cos(tt) *2
					mysteryboxes[i].rotation.y = tt * 1.5
				}

				hero.anim(tt)
				hero.bulletUpdate(tt, phys)


				// Boss Game
				window.bossGame ? window.boss.update(delta) : false

				RENDERER.render(SCENE, CAMERA);
				if (typeof Obj.loop === "function") {
					window.requestAnimationFrame(Obj.loop)
				}

				return;
			}

			// start loop
			Obj.loop = window.loop
			Obj.loop()

			return;
		}

		Obj.startGame = startGame
		Obj.startAnim = startAnim

		function gameOver() {

			if (window.bossGame) {
				var b = SCENE.getObjectByName("boss")
				b.traverse(e => {
					if (e.type === "Mesh") {
						e.material.dispose()
						e.geometry.dispose()
					}
				})
				SCENE.remove(b)
			}

			SCENE.remove(b)

			Utils.playSound(Sound.gameOver)

			// stop clock

			window.inGame = false

			$("#status").text("")
			Profile.level = Profile.level

			Obj.loop = undefined
			clearInterval(Obj.counter)
			clearInterval(Obj.boxes)

			// clear scene childrens
			for (var j = 0; j < enemyList.length; j++) {

				enemyList[j].geometry.dispose()
				enemyList[j].material.dispose()
				SCENE.remove(enemyList[j])

				$(`#${enemyList[j].name}`).remove()
			}
			window.enemyList.length = 0

			for (var m = 0; m < mysteryboxes.length; m++) {

				mysteryboxes[m].traverse(e => {
					e.type === "Mesh" ? e.geometry.dispose() : false
					e.type === "Mesh" ? e.material.dispose() : false
				})

				SCENE.remove(mysteryboxes[m])

			}
			window.mysteryboxes.length = 0


			for (var o = 0; o < droppedBomb.length; o++) {
				SCENE.remove(droppedBomb[o])
			}

			droppedBomb.length = 0

			for (var c = 0; c < droppedCoins.length; c++) {
				SCENE.remove(droppedCoins[c])
			}

			droppedCoins.length = 0

			$("#statcount, #counter, #life, #bombbar, #atombomb, #critical, #utils, #mapicon")
				.css("display", "none")

			$("#joystick")
				.css("opacity", "0")

			// update time over and gameover stat

			$("#zkilled").text("killed " + window.killed)
			$("#cgained").text("coins " + Profile.coins)
			$("#rank").text(Profile.rank)
			window.enemies.length = 0

			// Center the hero
			character.position.set(0, character.position.y, 0)
			pLight.position.set(0, pLight.position.y, 3.8)

			var ps = new Three.Vector3().copy(CAMERA.position)
			var tarPs = new Three.Vector3(20, 30, 20)

			TweenMax.to(CAMERA.position, 1.8, {
				x: tarPs.x,
				y: tarPs.y,
				z: tarPs.z,
				easing: Power2.easingIn,
				onUpdate: function() {
					CAMERA.lookAt(character.position)
				},
				onComplete: function() {
					CAMERA.lookAt(character.position)
					$("#gameover, #time, #home")
						.css("display", "block")
					$("#gameoverstat").css("display", "grid")
				}
			})


			CLOCK.start()

			var overAnim = function() {

				var b = CLOCK.getElapsedTime()
				character.rotation.y = Math.sin(b) * .6
				cu.rotation.y = b * 1.6
				RENDERER.render(SCENE, CAMERA)
				hero.anim(b)
				CAMERA.lookAt(character.position)
				if (typeof overAnim === "function") {
					window.requestAnimationFrame(overAnim)
				}
			}
			overAnim()

			// Update FACEBOOK PLAYER DATA
			/*Facebook.player.setDataAsync({
				level: Profile.level,
				coins: Profile.coins,
				rank: Profile.rank,
				keys: Profile.keys,
				energy: Profile.energy
			}).then(() => {
				console.log("data updated!")
			}).catch(e => {
				console.warn(e)
			})*/

			// home 
			$("#home").on('click', function() {
				Utils.playSound(Sound.setting)

				//restart hero Character
				window.hero.hpLeft = Profile.maxHP
				window.hero.velocity = Profile.velocity
				window.hero.bullets = Profile.bombs
				Profile.atomLevel = 0

				window.location.reload()

				return;
			})

		}

		Obj.gameOver = gameOver

		function gameWin() {

			$(".ccns, #ccnscoin, #critical").remove()
			Utils.playSound(Sound.gameWin)

			window.inGame = false

			// increase level
			$("#status, #gamewin2").text("")

			$("#gamewin2").html("You passed level " + Profile.level + " <br /> +100 coins")

			Profile.level = Profile.level + 1
			hero.coins = hero.coins + 100

			// clear timer and Obj loop function
			Obj.loop = undefined
			clearInterval(Obj.counter)
			clearInterval(Obj.boxes)

			// clear scene childrens
			for (var j = 0; j < enemyList.length; j++) {
				enemyList[j].geometry.dispose()
				enemyList[j].material.dispose()
				SCENE.remove(enemyList[j])
			}

			enemyList.length = 0

			for (var m = 0; m < mysteryboxes.length; m++) {

				mysteryboxes[m].traverse(e => {
					e.type === "Mesh" ? e.geometry.dispose() : false
					e.type === "Mesh" ? e.material.dispose() : false
				})

				SCENE.remove(mysteryboxes[m])

			}
			window.mysteryboxes.length = 0


			for (var c = 0; c < droppedCoins.length; c++) {
				SCENE.remove(droppedCoins[c])
			}

			droppedCoins.length = 0

			// hide stats and joystick
			$("#statcount, #counter, #life, #bombbar, #atombomb, #utils, #mapicon")
				.css("display", "none")
			$("#joystick")
				.css("opacity", "0")

			// animate scene win
			pLight.position.set(character.position.x + 2.8, pLight.position.y, character.position.z + 2.8)

			var ps = new Three.Vector3().copy(CAMERA.position)
			var tarPs = new Three.Vector3(character.position.x + 15, character.position.y + 10, character.position.z + 15)

			TweenMax.to(CAMERA.position, 2.5, {
				x: tarPs.x,
				y: tarPs.y,
				z: tarPs.z,

				onUpdate: function() {
					CAMERA.lookAt(character.position)
				},
				onComplete: function() {
					CAMERA.lookAt(character.position)
					// display elements
					$("#gamewin, #gamewin2, #home").css("display", "grid")
					// Facebook Save Data function
				}
			})


			// Win animation
			var winAnim = function() {

				var b = CLOCK.getElapsedTime()
				cu.rotation.y = b * 1.6
				character.rotation.y = Math.sin(b) * .6

				hero.anim(b)

				RENDERER.render(SCENE, CAMERA)
				CAMERA.lookAt(character.position)
				if (typeof winAnim === "function") {
					window.requestAnimationFrame(winAnim)
				}
			}
			winAnim()

			// Update FACEBOOK PLAYER DATA
			/*	Facebook.player.setDataAsync({
					level: Profile.level,
					coins: Profile.coins,
					rank: Profile.rank,
					keys: Profile.keys,
					energy: Profile.energy
				}).then(() => {
					console.log("data updated!")
				}).catch(e => {
					console.warn(e)
				})*/

			// Home 
			$("#home").on('click', function() {
				Utils.playSound(Sound.setting)

				character.position.set(0, character.position.y, 0)
				CAMERA.position.set(0, 20, 20)
				CAMERA.lookAt(character.position)
				pLight.position.set(0, pLight.position.y, 0)

				window.killed = 0

				// Update Game data
				$("#energy-txt").text("x" + Profile.energy)

				CAMERA.lookAt(character.position)
				CAMERA.lookAt(character.position)
				character.rotation.y = -10
				$("#playbtn, #energy-container, #coin-container").css("display", "grid")
				$("#settings, #version").css("display", "block")

				Anim()

				//restart hero Character
				window.hero.hpLeft = Profile.maxHP
				window.hero.velocity = Profile.velocity
				window.hero.bullets = Profile.bombs
				Profile.atomLevel = 0

				window.character.children[0].geometry.dispose()
				window.character.children[0].material.dispose()
				SCENE.remove(window.character)

				character = undefined
				ch();

				winAnim = undefined
				// hide elements
				$("#gameover, #time, #home, #gameoverstat, #atombomb, #gamewin, #gamewin2")
					.css("display", "none")

				// start initial Animation
				/*Obj.initAnim = initAnim
				Obj.initAnim()*/

				//*******************************************
				/**************************************************
					Additional Rewards
				**************************************************/

				var rewardsArr = [
					{
						type: "coin",
						value: 0
				},
					{
						type: "key",
						value: 0
				},
					{
						type: "energy",
						value: 0
				}
			]

				for (var rw = 0; rw < window.addRewards.length; rw++) {
					switch (addRewards[rw].type) {
						case "coin":
							rewardsArr[0].value += addRewards[rw].value
							break;
						case "key":
							rewardsArr[1].value += addRewards[rw].value
							break;
						case "energy":
							rewardsArr[2].value += addRewards[rw].value
							break;
					}
				}

				// append rewards to banner

				for (var y = 0; y < 3; y++) {
					$(`#reward${y}`).text("+" + rewardsArr[y].value)
				}

				$("#ccnscvr").prepend(`	<img class="ccns" src="assets/images/coin_reward.png" alt="" />
			<p id="ccnscoin">+100 Coins</p>`)

				// REWARDS TIME
				var o = setTimeout(() => {
					$("#cover, #ccnscvr").css("display", "block")
					clearTimeout(o)
				}, 800)
				return;
			})
		}

		Obj.gameWin = gameWin

		function EnemyBoss() {
			window.boss = new Character.EnemyBoss()

			var m = boss.render()
			m.name = "boss"
			SCENE.add(m)

			window.bossGame = true
			tips("Boss Enemy has been summoned!")
		}

		Obj.EnemyBoss = EnemyBoss

		function tips(txt) {

			$("#tips").css({
				display: "grid",
				width: "100%",
				left: "0%"
			})

			$("#tips").text(txt)

			var tp = setTimeout(() => {
				$("#tips").css({ width: "0%", left: "50%", marginLeft: "-0%" })
				clearTimeout(tp)
			}, 4000)
		}
		Obj.tips = tips

		/**************************************************
		Instantiate Game Object
		*************************************************/
		GAME === Obj ? true : GAME = Obj

	})

});

export { GAME }