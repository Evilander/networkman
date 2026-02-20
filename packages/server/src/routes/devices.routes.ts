import { Router } from 'express';
import crypto from 'node:crypto';
import { deviceCreateSchema, deviceUpdateSchema, type DeviceStatus } from '@networkman/shared';
import { DeviceRepository } from '../database/repositories/device.repository.js';
import { pingHost } from '../utils/ping.js';

export function createDeviceRoutes(deviceRepo: DeviceRepository): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const status = req.query.status as DeviceStatus | undefined;
    const devices = deviceRepo.findAll(status);
    res.json(devices);
  });

  router.get('/:id', (req, res) => {
    const device = deviceRepo.findById(req.params.id);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    res.json(device);
  });

  router.post('/', (req, res) => {
    const parsed = deviceCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

    const existing = deviceRepo.findByIp(parsed.data.ip);
    if (existing) { res.status(409).json({ error: 'Device with this IP already exists', device: existing }); return; }

    const id = crypto.randomUUID();
    const device = deviceRepo.create(id, parsed.data);
    res.status(201).json(device);
  });

  router.patch('/:id', (req, res) => {
    const parsed = deviceUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

    const device = deviceRepo.update(req.params.id, parsed.data);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
    res.json(device);
  });

  router.delete('/:id', (req, res) => {
    const deleted = deviceRepo.delete(req.params.id);
    if (!deleted) { res.status(404).json({ error: 'Device not found' }); return; }
    res.status(204).send();
  });

  router.post('/:id/ping', async (req, res) => {
    const device = deviceRepo.findById(req.params.id);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }

    const result = await pingHost(device.ip, 5000, 4);
    res.json({ device: device.name, ip: device.ip, ...result });
  });

  router.post('/:id/speedtest', async (req, res) => {
    const device = deviceRepo.findById(req.params.id);
    if (!device) { res.status(404).json({ error: 'Device not found' }); return; }

    try {
      // Run 10 individual pings to gather latency samples
      const pingCount = 10;
      const latencies: number[] = [];
      let totalLoss = 0;

      const pingPromises: Promise<void>[] = [];

      for (let i = 0; i < pingCount; i++) {
        pingPromises.push(
          pingHost(device.ip, 5000, 1).then((result) => {
            if (result.alive && result.time !== null) {
              latencies.push(result.time);
            }
            totalLoss += result.packetLoss;
          })
        );
      }

      await Promise.all(pingPromises);

      // Calculate statistics
      const avgPacketLoss = totalLoss / pingCount;

      if (latencies.length === 0) {
        res.json({
          avgLatency: 0,
          minLatency: 0,
          maxLatency: 0,
          jitter: 0,
          packetLoss: avgPacketLoss,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const sum = latencies.reduce((a, b) => a + b, 0);
      const avgLatency = sum / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);

      // Jitter = standard deviation of latency (variance in round-trip times)
      const variance = latencies.reduce((acc, val) => acc + Math.pow(val - avgLatency, 2), 0) / latencies.length;
      const jitter = Math.sqrt(variance);

      res.json({
        avgLatency,
        minLatency,
        maxLatency,
        jitter,
        packetLoss: avgPacketLoss,
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({ error: 'Speed test failed' });
    }
  });

  return router;
}
