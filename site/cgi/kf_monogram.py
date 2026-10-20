"""Chrome KF monogram for the hero of kaiohomem.github.io, rendered in Blender Cycles.

The site draws these frames on a <canvas> and scrubs them: frames 1-40 play once as the
entrance (K and F fly in from depth and lock together), frames 41-90 follow the scroll
(the locked monogram turns and the violet rim light sweeps across it).

Same approach as Motion-sfx-ae/tools/blender: Cycles on the GPU, transparent film,
emissive cards so the chrome has something to reflect. No motion blur, because the
frames are shown at whatever rate the visitor scrolls.

Run headless:
    blender -b -P site/cgi/kf_monogram.py -- --out site/cgi/out [--samples 48] [--size 1200] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True, help="output folder for the PNG frames")
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--size", type=int, default=1200, help="square resolution in px")
ap.add_argument("--preview", action="store_true", help="render 4 key frames only")
args = ap.parse_args(argv)
# Blender resolves a relative render path against the drive root, not the cwd.
args.out = os.path.abspath(args.out).replace("\\", "/")

FRAMES = 90
LOCK = 40  # last frame of the entrance
VIOLET = (0.258, 0.107, 0.922)  # #8b5cf6 in linear RGB

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = FRAMES
scene.render.resolution_x = args.size
scene.render.resolution_y = args.size
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.use_motion_blur = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"

scene.render.engine = "CYCLES"
cycles = scene.cycles
cycles.samples = args.samples
cycles.use_denoising = True
cycles.denoiser = "OPENIMAGEDENOISE"
cycles.max_bounces = 8
cycles.glossy_bounces = 6
prefs = bpy.context.preferences.addons["cycles"].preferences
for backend in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = backend
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == backend]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == backend
            cycles.device = "GPU"
            print(f"[kf] rendering on {backend}: {[d.name for d in gpus]}")
            break
    except TypeError:
        continue
else:
    print("[kf] no GPU backend found, rendering on CPU")

# ---------------------------------------------------------------- world
# A procedural studio sphere. The film is transparent, so it only shows in reflections.
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
coord = wn.new("ShaderNodeTexCoord")
sep = wn.new("ShaderNodeSeparateXYZ")
mapr = wn.new("ShaderNodeMapRange")
mapr.inputs["From Min"].default_value = -1
mapr.inputs["From Max"].default_value = 1
ramp = wn.new("ShaderNodeValToRGB")
els = ramp.color_ramp.elements
els[0].position, els[0].color = 0.0, (0.002, 0.002, 0.003, 1)
els[1].position, els[1].color = 1.0, (0.85, 0.88, 0.95, 1)
for pos, col in ((0.42, (0.005, 0.005, 0.007, 1)), (0.51, (0.6, 0.62, 0.68, 1)), (0.57, (0.008, 0.008, 0.01, 1)), (0.82, (0.12, 0.12, 0.14, 1))):
    e = els.new(pos)
    e.color = col
wl.new(coord.outputs["Generated"], sep.inputs[0])
wl.new(sep.outputs["Z"], mapr.inputs["Value"])
wl.new(mapr.outputs["Result"], ramp.inputs["Fac"])
wl.new(ramp.outputs["Color"], wn["Background"].inputs["Color"])
wn["Background"].inputs["Strength"].default_value = 1.0


# ---------------------------------------------------------------- materials
def principled(name, color, metallic, roughness, coat):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.03
    return mat


def emission(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.remove(nodes["Principled BSDF"])
    em = nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = strength
    mat.node_tree.links.new(em.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


chrome = principled("Chrome", (0.82, 0.84, 0.88), 1.0, 0.05, 1.0)
dark = principled("DarkChrome", (0.32, 0.33, 0.36), 1.0, 0.09, 1.0)

# ---------------------------------------------------------------- the letters
FONT_CANDIDATES = ["C:/Windows/Fonts/ariblk.ttf", "C:/Windows/Fonts/arialbd.ttf"]
font = None
for path in FONT_CANDIDATES:
    if os.path.exists(path):
        font = bpy.data.fonts.load(path)
        break


def letter(name, body, mat):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    if font:
        curve.font = font
    curve.size = 2.6
    curve.extrude = 0.28
    curve.bevel_depth = 0.035
    curve.bevel_resolution = 5
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    obj = bpy.data.objects.new(name, curve)
    obj.data.materials.append(mat)
    obj.rotation_mode = "XYZ"
    scene.collection.objects.link(obj)
    return obj


rig = bpy.data.objects.new("KF", None)
rig.rotation_mode = "XYZ"
scene.collection.objects.link(rig)
k = letter("K", "K", chrome)
f = letter("F", "F", dark)
k.parent = rig
f.parent = rig
# Locked pose: the F tucks into the K's open side, slightly behind it.
K_LOCK = (-0.66, 0.0, 0.0)
F_LOCK = (0.74, 0.0, -0.12)

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85
cam = bpy.data.objects.new("Camera", cam_data)
cam.location = (0, -10.5, 0)
cam.rotation_euler = (math.radians(90), 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam
# Letters are authored in the XY plane; stand them up to face the camera (-Y).
rig.rotation_euler = (math.radians(90), 0, 0)


# ---------------------------------------------------------------- lights
def softbox(name, size, loc, rot, color, strength):
    """Emissive card: lights the letters and shows in their reflections, hidden from camera."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (*size, 1)
    obj.data.materials.append(emission(name, color, strength))
    obj.visible_camera = False
    return obj


softbox("Key", (7, 3), (-4, -6, 5), (math.radians(55), 0, math.radians(-35)), (1, 1, 1), 14)
softbox("Fill", (6, 2), (3, -8, -4), (math.radians(120), 0, math.radians(20)), (1, 1, 1), 5)
softbox("Top", (10, 1.2), (0, -2, 7), (0, 0, 0), (1, 1, 1), 9)
softbox("FrontWide", (9, 5), (-7, -9, 1), (math.radians(90), 0, math.radians(-40)), (1, 1, 1), 4)
rim = softbox("RimViolet", (0.6, 9), (6, 3, 0), (math.radians(90), 0, math.radians(120)), VIOLET, 0)
softbox("RimCool", (0.6, 9), (-6, 3, 0), (math.radians(90), 0, math.radians(-120)), (0.6, 0.7, 1.0), 4)


# ---------------------------------------------------------------- animation
def key(obj, frame, loc=None, rot=None):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)
    if rot is not None:
        obj.rotation_euler = [math.radians(a) for a in rot]
        obj.keyframe_insert("rotation_euler", frame=frame)


# Entrance: both letters start far back and apart, turned away, then lock with a small overshoot.
key(k, 1, (-5.5, 1.5, -9), (20, -70, 25))
key(f, 1, (5.5, -1.2, -11), (-25, 80, -30))
key(k, 30, (K_LOCK[0] - 0.08, 0, 0.15), (0, -4, 0))
key(f, 30, (F_LOCK[0] + 0.1, 0, F_LOCK[2] + 0.12), (0, 5, 0))
key(k, LOCK, K_LOCK, (0, 0, 0))
key(f, LOCK, F_LOCK, (0, 0, 0))

# Scroll part: the locked monogram turns from -28 to +32 degrees and tilts slightly.
key(rig, FRAMES, rot=(96, 0, 24))
key(rig, 1, rot=(90, 0, -28))
key(rig, LOCK, rot=(90, 0, -6))

# The violet rim light wakes up on the lock and peaks in the scroll part.
strength = rim.data.materials[0].node_tree.nodes["Emission"].inputs["Strength"]
for frame, value in ((1, 0), (LOCK - 4, 0), (LOCK + 2, 22), (FRAMES, 12)):
    strength.default_value = value
    strength.keyframe_insert("default_value", frame=frame)

# Smooth ease on everything (no motion blur, so bezier is safe here).
for action in bpy.data.actions:
    for fc in getattr(action, "fcurves", []):
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "AUTO"

# ---------------------------------------------------------------- render
os.makedirs(args.out, exist_ok=True)
if args.preview:
    for frame in (1, 20, LOCK, FRAMES):
        scene.frame_set(frame)
        scene.render.filepath = f"{args.out}/preview_{frame:04d}.png"
        bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = f"{args.out}/"
    bpy.ops.render.render(animation=True)
print("[kf] done")
