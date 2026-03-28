const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getDeliveries,
  getDelivery,
  assignRider,
  updateStatus,
  trackDelivery,
  getMyDeliveries,
  getRiderDeliveries,
} = require('./delivery.controller');
const {
  createDeliveryValidator,
  assignRiderValidator,
  updateStatusValidator,
} = require('./delivery.validator');
const { protect } = require('../../common/middleware/auth.middleware');
const { authorize } = require('../../common/middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Delivery management, assignment, tracking
 */

/**
 * @swagger
 * /api/deliveries/track/{trackingId}:
 *   get:
 *     summary: Track a delivery by tracking ID (public)
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tracking ID (e.g. RTDMS-A1B2C3)
 *         example: RTDMS-A1B2C3
 *     responses:
 *       200:
 *         description: Delivery tracking info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     trackingId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     statusHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pickupAddress:
 *                       type: string
 *                     deliveryAddress:
 *                       type: string
 *                     currentLocation:
 *                       type: object
 *                     rider:
 *                       type: object
 *       404:
 *         description: Delivery not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/track/:trackingId', trackDelivery);

// All routes below require authentication
router.use(protect);

/**
 * @swagger
 * /api/deliveries/my-deliveries:
 *   get:
 *     summary: Get farmer's own deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer's deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Farmer role required
 */
router.get('/my-deliveries', authorize('customer'), getMyDeliveries);

/**
 * @swagger
 * /api/deliveries/rider-deliveries:
 *   get:
 *     summary: Get delivery agent's assigned deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider's assigned deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Delivery Agent role required
 */
router.get('/rider-deliveries', authorize('rider'), getRiderDeliveries);

/**
 * @swagger
 * /api/deliveries/{id}/status:
 *   put:
 *     summary: Update delivery status (Delivery Agent only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in-transit, delivered]
 *                 example: in-transit
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Not assigned to this delivery
 */
router.put('/:id/status', authorize('rider'), updateStatusValidator, updateStatus);

/**
 * @swagger
 * /api/deliveries:
 *   post:
 *     summary: Create a new delivery (Dispatcher only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer, pickupAddress, deliveryAddress, packageDescription]
 *             properties:
 *               customer:
 *                 type: string
 *                 description: Customer User ID
 *                 example: 665a1b2c3d4e5f6a7b8c9d0e
 *               pickupAddress:
 *                 type: string
 *                 example: 12 Marina Road, Lagos Island
 *               pickupCoords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 6.4541
 *                   lng:
 *                     type: number
 *                     example: 3.4218
 *               deliveryAddress:
 *                 type: string
 *                 example: 45 Allen Avenue, Ikeja
 *               deliveryCoords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 6.6018
 *                   lng:
 *                     type: number
 *                     example: 3.3515
 *               packageDescription:
 *                 type: string
 *                 example: Standard parcel - electronics
 *               rider:
 *                 type: string
 *                 description: Optional Rider User ID to assign immediately
 *     responses:
 *       201:
 *         description: Delivery created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Dispatcher role required
 */
router.post('/', authorize('admin'), createDeliveryValidator, createDelivery);

/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: Get all deliveries with pagination (Dispatcher only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, in-transit, delivered]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 */
router.get('/', authorize('admin'), getDeliveries);

/**
 * @swagger
 * /api/deliveries/{id}/assign:
 *   put:
 *     summary: Assign a delivery agent to a delivery (Dispatcher only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [riderId]
 *             properties:
 *               riderId:
 *                 type: string
 *                 description: Rider User ID
 *                 example: 665a1b2c3d4e5f6a7b8c9d0e
 *     responses:
 *       200:
 *         description: Rider assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Invalid rider or delivery already delivered
 *       404:
 *         description: Delivery not found
 */
router.put('/:id/assign', authorize('admin'), assignRiderValidator, assignRider);

/**
 * @swagger
 * /api/deliveries/{id}:
 *   get:
 *     summary: Get a single delivery (Dispatcher or assigned Delivery Agent)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery ID
 *     responses:
 *       200:
 *         description: Delivery details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       403:
 *         description: Not authorized to view this delivery
 *       404:
 *         description: Delivery not found
 */
router.get('/:id', authorize('admin', 'rider'), getDelivery);

module.exports = router;
