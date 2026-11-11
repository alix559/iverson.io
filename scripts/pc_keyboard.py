#!/usr/bin/env python3
"""Type NadaKit keys into the focused window.

Run this on the PC (Windows, Linux, or another Mac). The Mac app cannot pretend
to be an ordinary Bluetooth keyboard — Apple does not allow that — so this
program connects over Bluetooth Low Energy and types each key itself.

    pip install bleak pynput
    python pc_keyboard.py

Leave it running and focus the window that should receive the text. On macOS,
allow the terminal under Privacy & Security → Accessibility.
"""
import asyncio, sys

NAME = 'NadaKit'
SERVICE = '4e616461-6b69-4474-8000-000000000001'
CHAR = '4e616461-6b69-4474-8000-000000000002'
TEXT, KEY = 1, 2

def decode(frame):
    if not frame: raise ValueError('empty')
    op, payload = frame[0], frame[1:]
    if op == TEXT: return 'text', payload.decode()
    if op == KEY: return 'key', payload.decode()
    raise ValueError(op)

def main():
    try:
        from bleak import BleakClient, BleakScanner
        from pynput.keyboard import Controller, Key
    except ImportError:
        sys.exit('Install the two libraries this needs:  pip install bleak pynput')
    board = Controller()
    special = dict(space=Key.space, **{'return': Key.enter}, tab=Key.tab, backspace=Key.backspace,
                   escape=Key.esc, left=Key.left, right=Key.right, down=Key.down, up=Key.up)

    def on_notify(_char, data):
        try:
            kind, val = decode(bytes(data))
            if kind == 'text': board.type(val)
            else:
                key = special.get(val)
                if key is None: board.type(val)
                else: board.press(key); board.release(key)
        except Exception as e:
            print(f'Could not type that key ({e})', flush=True)

    async def once():
        print(f'Looking for {NAME}…', flush=True)
        def match(_d, ad):
            uuids = [str(u).lower() for u in (ad.service_uuids or [])]
            return SERVICE in uuids or (ad.local_name or '') == NAME
        dev = await BleakScanner.find_device_by_filter(match, timeout=20)
        if dev is None: return False
        print(f'Connecting to {dev.name or NAME}…', flush=True)
        async with BleakClient(dev) as client:
            await client.start_notify(CHAR, on_notify)
            print('Connected. Keys from the Mac go into the focused window.', flush=True)
            while client.is_connected: await asyncio.sleep(0.5)
        return True

    async def loop():
        while True:
            try:
                await once()
            except Exception as e:
                print(f'Bluetooth dropped ({e}). Looking again…', flush=True)
            await asyncio.sleep(1)

    try: asyncio.run(loop())
    except KeyboardInterrupt: print('\nStopped.', flush=True)

if __name__ == '__main__': main()
