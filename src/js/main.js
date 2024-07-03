import '../css/style.scss'
import * as THREE from "three";
import { radian } from "./utils";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import vertexSource from "./shader/vertexShader.glsl";
import fragmentSource from "./shader/fragmentShader.glsl";


class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector("#canvas");
    this.renderer = null;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.cameraFov = 45;
    this.cameraFovRadian = (this.cameraFov / 2) * (Math.PI / 180);
    this.cameraDistance = (this.viewport.height / 2) / Math.tan(this.cameraFovRadian);
    // this.controls = null;

    this.instancedMesh = null;
    this.instanceCount = 100;
    this.instanceDummy = new THREE.Object3D();

    this.animationParams = {
      speed: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
      scale: {
        x: 1.0,
        y: 1.0,
        z: 1.0,
      }
    }

    this.uniforms = {
      uTime: {
        value: 0.0
      },
      uTex: {
        value: this.texture
      },
      uResolution: {
        value: new THREE.Vector2(this.viewport.width, this.viewport.height)
      },
      uTexResolution: {
        value: new THREE.Vector2(2048, 1024)
      },
    };

    this.clock = new THREE.Clock();

    this.init();

  }

  _setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(this.cameraFov, this.viewport.width / this.viewport.height, 1, this.cameraDistance * 2);
    this.camera.position.z = this.cameraDistance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  // _setControlls() {
  //   this.controls = new OrbitControls(this.camera, this.canvas);
  //   this.controls.enableDamping = true;
  // }

  _setLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 1, 1);
    this.scene.add(light);
  }


  _addRingMesh() {
    const geometry = new THREE.RingGeometry(300, 300.5, 128);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.instanceCount);

    for (let i = 0; i < this.instanceCount; i++) {
      this.instanceDummy.rotation.set(0, 0, 0);
      this.instanceDummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.instanceDummy.matrix);
    }

    this.scene.add(this.instancedMesh);
  }

  _setAnimation() {
    // const tl1 = gsap.timeline({
    //   scrollTrigger: {
    //     trigger: '#section02',
    //     start: 'top bottom',
    //     toggleActions: 'play none none reverse',
    //     // markers: true,
    //     onEnter: ()=> {
    //       console.log('on enter');
    //       gsap.to(this.animationParams.scale, {
    //         x: 0.5,
    //         y: 1.4,
    //         duration: 0.9,
    //         ease: "power3.inOut"
    //       })
    //     },
    //     onLeaveBack: ()=> {
    //       console.log('on leaveback');
    //       gsap.to(this.animationParams.scale, {
    //         x: 1.0,
    //         y: 1.0,
    //         duration: 0.9,
    //         ease: "power3.inOut"
    //       })
    //     }
    //   }
    // });

    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section02',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        // markers: true,
      }
    });
    tl1.to(this.animationParams.scale, {
      x: 0.5,
      y: 1.4,
    })

  }

  init() {
    this._setRenderer();
    this._setCamera();
    // this._setControlls();
    this._setLight();
    this._addRingMesh();
    this._setAnimation();

    this._update();
    this._addEvent();
  }

  _update() {
    const elapsedTime = this.clock.getElapsedTime();
    this.uniforms.uTime.value = elapsedTime * 0.03;

    for (let i = 0; i < this.instanceCount; i++) {
      const index = i + 1;
      this.instanceDummy.rotation.set(
        radian(index * 3) + elapsedTime * 1.1,
        radian(index * 1.5) + elapsedTime * 1.06,
        radian(index * 1) + elapsedTime * 0.05,
        // radian(index * 3) + elapsedTime * 0.0,
        // radian(index * 1.5) + elapsedTime * 0.1,
        // radian(index * 1) + elapsedTime * 0.0,
        // 0,
        // 0,
        // 0
      );
      // this.instanceDummy.scale.set(Math.sin(elapsedTime + index * 0.05), Math.cos(elapsedTime + index * 0.03), 1.0);
      this.instanceDummy.scale.set(this.animationParams.scale.x, this.animationParams.scale.y, this.animationParams.scale.z);
      this.instanceDummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.instanceDummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    // this.controls.update();
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
    // カメラの位置を調整
    this.cameraDistance = (this.viewport.height / 2) / Math.tan(this.cameraFovRadian); //ウインドウぴったりのカメラ距離
    this.camera.position.z = this.cameraDistance;
    // uniforms変数に反映
    this.mesh.material.uniforms.uResolution.value.set(this.viewport.width, this.viewport.height);
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
  }
}

const main = new Main();
