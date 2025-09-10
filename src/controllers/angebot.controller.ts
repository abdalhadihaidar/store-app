import { Request, Response } from 'express';
import { AngebotService } from '../services/angebot.service';
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import fs from 'fs';
import path from 'path';

export class AngebotController {
  /**
   * Create angebot from existing order
   */
  static async createFromOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, validUntil, notes } = req.body;
      const createdBy = (req as any).user?.id;

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }

      const angebot = await AngebotService.createAngebotFromOrder(
        orderId,
        createdBy,
        validUntil ? new Date(validUntil) : undefined,
        notes
      );

      res.status(201).json({
        success: true,
        message: 'Angebot created successfully',
        data: angebot
      });
    } catch (error: any) {
      console.error('Error creating angebot from order:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create angebot'
      });
    }
  }

  /**
   * Create direct angebot (not from order)
   */
  static async createDirect(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, storeId, items, validUntil, notes } = req.body;
      const createdBy = (req as any).user?.id;

      if (!customerId || !storeId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Customer ID, Store ID, and items are required'
        });
        return;
      }

      const angebot = await AngebotService.createDirectAngebot(
        customerId,
        storeId,
        items,
        createdBy,
        validUntil ? new Date(validUntil) : undefined,
        notes
      );

      res.status(201).json({
        success: true,
        message: 'Angebot created successfully',
        data: angebot
      });
    } catch (error: any) {
      console.error('Error creating direct angebot:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create angebot'
      });
    }
  }

  /**
   * Get all angebots with filtering
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, status, customerId, page = 1, limit = 10 } = req.query;
      const userRole = (req as any).user?.role;
      const userStoreId = (req as any).user?.storeId;

      // If user is not admin, filter by their store
      const finalStoreId = userRole === 'admin' ? storeId : userStoreId;

      const result = await AngebotService.getAllAngebots(
        finalStoreId ? Number(finalStoreId) : undefined,
        status as string,
        customerId ? Number(customerId) : undefined,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result.angebots,
        pagination: {
          currentPage: Number(page),
          totalPages: result.totalPages,
          totalItems: result.total,
          itemsPerPage: Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error getting angebots:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get angebots'
      });
    }
  }

  /**
   * Get angebot by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const angebot = await AngebotService.getAngebotById(Number(id));

      if (!angebot) {
        res.status(404).json({
          success: false,
          message: 'Angebot not found'
        });
        return;
      }

      res.json({
        success: true,
        data: angebot
      });
    } catch (error: any) {
      console.error('Error getting angebot:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get angebot'
      });
    }
  }

  /**
   * Update angebot items (prices, quantities, taxes)
   */
  static async updateItems(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { items } = req.body;
      const updatedBy = (req as any).user?.id;

      if (!items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          message: 'Items array is required'
        });
        return;
      }

      const angebot = await AngebotService.updateAngebotItems(
        Number(id),
        items,
        updatedBy
      );

      res.json({
        success: true,
        message: 'Angebot items updated successfully',
        data: angebot
      });
    } catch (error: any) {
      console.error('Error updating angebot items:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update angebot items'
      });
    }
  }

  /**
   * Update angebot status
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.id;

      if (!status || !['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
        return;
      }

      const angebot = await AngebotService.updateAngebotStatus(
        Number(id),
        status,
        updatedBy
      );

      res.json({
        success: true,
        message: 'Angebot status updated successfully',
        data: angebot
      });
    } catch (error: any) {
      console.error('Error updating angebot status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update angebot status'
      });
    }
  }

  /**
   * Convert accepted angebot to order
   */
  static async convertToOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const createdBy = (req as any).user?.id;

      const order = await AngebotService.convertAngebotToOrder(
        Number(id),
        createdBy
      );

      res.json({
        success: true,
        message: 'Angebot converted to order successfully',
        data: order
      });
    } catch (error: any) {
      console.error('Error converting angebot to order:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to convert angebot to order'
      });
    }
  }

  /**
   * Delete angebot
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await AngebotService.deleteAngebot(Number(id));

      res.json({
        success: true,
        message: 'Angebot deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting angebot:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete angebot'
      });
    }
  }

  /**
   * Get angebots by customer ID
   */
  static async getByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await AngebotService.getAllAngebots(
        undefined,
        undefined,
        Number(customerId),
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result.angebots,
        pagination: {
          currentPage: Number(page),
          totalPages: result.totalPages,
          totalItems: result.total,
          itemsPerPage: Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error getting customer angebots:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customer angebots'
      });
    }
  }

  /**
   * Download angebot PDF
   */
  static async downloadPdf(req: Request, res: Response): Promise<void> {
    try {
      const angebotId = Number(req.params.id);
      console.log('downloadPdf called with params:', req.params, 'angebotId:', angebotId, 'Type:', typeof angebotId);
      
      // Use a simple query to avoid connection issues - we only need basic angebot data for PDF download
      const angebot = await AngebotService.getBasicAngebotById(angebotId);
      if (!angebot) {
        res.status(404).json({
          success: false,
          message: 'Angebot not found'
        });
        return;
      }

      if (!angebot.pdfPath || !fs.existsSync(angebot.pdfPath)) {
        res.status(404).json({
          success: false,
          message: 'PDF file not found'
        });
        return;
      }

      const isHtmlFile = angebot.pdfPath.endsWith('.html');
      const fileName = `angebot_${angebot.angebotNumber || angebot.id}.${isHtmlFile ? 'html' : 'pdf'}`;
      
      res.setHeader('Content-Type', isHtmlFile ? 'text/html' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(angebot.pdfPath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming PDF file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading PDF file'
          });
        }
      });
    } catch (error: any) {
      console.error('Error downloading angebot PDF:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download PDF'
      });
    }
  }

  /**
   * Regenerate angebot PDF (for debugging)
   */
  static async regeneratePdf(req: Request, res: Response): Promise<void> {
    try {
      const angebotId = Number(req.params.id);
      console.log('regeneratePdf called with angebotId:', angebotId);
      
      const angebot = await AngebotService.getAngebotById(angebotId);
      if (!angebot) {
        res.status(404).json({
          success: false,
          message: 'Angebot not found'
        });
        return;
      }

      // Get order data
      const order = angebot.orderId ? await Order.findByPk(angebot.orderId, {
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'orderProduct' }] },
          { model: Store, as: 'store' }
        ]
      }) : null;

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found for this angebot'
        });
        return;
      }

      // Regenerate PDF
      const { generateAngebotPdf } = await import('../utils/pdf.util');
      const pdfResult = await generateAngebotPdf(angebot, order, order.items || []);
      
      // Update angebot with new PDF path
      await angebot.update({ pdfPath: pdfResult.filePath });

      res.json({
        success: true,
        message: 'PDF regenerated successfully',
        data: {
          pdfPath: pdfResult.filePath,
          isHtml: pdfResult.filePath.endsWith('.html')
        }
      });
    } catch (error: any) {
      console.error('Error regenerating angebot PDF:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to regenerate PDF'
      });
    }
  }

  /**
   * Test Puppeteer connection
   */
  static async testPuppeteer(req: Request, res: Response): Promise<void> {
    try {
      const { testPuppeteerConnection } = await import('../utils/pdf.util');
      const isWorking = await testPuppeteerConnection();
      
      res.json({
        success: isWorking,
        message: isWorking ? 'Puppeteer is working correctly' : 'Puppeteer is not working',
        data: {
          puppeteerWorking: isWorking
        }
      });
    } catch (error: any) {
      console.error('Error testing Puppeteer:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to test Puppeteer'
      });
    }
  }
}
