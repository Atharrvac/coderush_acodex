/**
 * Notification Service - GovTech CRM
 * Handles real-time notifications for all user roles
 */

const { supabase } = require('../config/supabase');
const translationService = require('./translation.service');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      // Citizen notifications
      'complaint_submitted': {
        title: 'Complaint Submitted',
        title_hi: 'शिकायत दर्ज की गई',
        title_mr: 'तक्रार सादर केली',
        template: 'Your complaint has been submitted successfully. Reference ID: {complaintId}',
        template_hi: 'आपकी शिकायत सफलतापूर्वक दर्ज की गई है। संदर्भ आईडी: {complaintId}',
        template_mr: 'तुमची तक्रार यशस्वीरित्या सादर केली गेली आहे. संदर्भ आयडी: {complaintId}'
      },
      'complaint_assigned': {
        title: 'Complaint Assigned',
        title_hi: 'शिकायत सौंपी गई',
        title_mr: 'तक्रार नियुक्त केली',
        template: 'Your complaint has been assigned to {departmentName}',
        template_hi: 'आपकी शिकायत {departmentName} को सौंपी गई है',
        template_mr: 'तुमची तक्रार {departmentName} ला नियुक्त केली गेली आहे'
      },
      'status_update': {
        title: 'Status Update',
        title_hi: 'स्थिति अपडेट',
        title_mr: 'स्थिती अपडेट',
        template: 'Your complaint status has been updated to: {status}',
        template_hi: 'आपकी शिकायत की स्थिति अपडेट की गई है: {status}',
        template_mr: 'तुमच्या तक्रारीची स्थिती अपडेट केली गेली आहे: {status}'
      },
      'complaint_resolved': {
        title: 'Complaint Resolved',
        title_hi: 'शिकायत हल हो गई',
        title_mr: 'तक्रार सोडवली',
        template: 'Your complaint has been resolved by {officerName}',
        template_hi: 'आपकी शिकायत {officerName} द्वारा हल की गई है',
        template_mr: 'तुमची तक्रार {officerName} द्वारे सोडवली गेली आहे'
      },
      
      // Officer notifications
      'new_complaint': {
        title: 'New Complaint Assigned',
        template: 'New {category} complaint assigned to you in {area}',
      },
      'complaint_escalated': {
        title: 'Complaint Escalated',
        template: 'Complaint #{complaintId} has been escalated due to delay',
      },
      
      // Department notifications
      'new_department_complaint': {
        title: 'New Complaint',
        template: 'New {category} complaint received in your department',
      },
      'performance_alert': {
        title: 'Performance Alert',
        template: 'Department resolution time is below target',
      }
    };
  }

  // Send notification to citizen
  async notifyCitizen(userId, type, customTitle = null, customMessage = null, complaintId = null, data = {}) {
    try {
      // Get user's preferred language
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('language_preference')
        .eq('id', userId)
        .single();

      const userLang = user?.language_preference || 'en';
      const notifConfig = this.notificationTypes[type];

      if (!notifConfig) {
        console.error('Unknown notification type:', type);
        return false;
      }

      // Get localized title and message
      const title = customTitle || this.getLocalizedText(notifConfig, 'title', userLang);
      const message = customMessage || this.formatMessage(notifConfig.template, data, userLang);

      // Create notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          title_hi: notifConfig.title_hi,
          title_mr: notifConfig.title_mr,
          message,
          message_hi: await this.translateIfNeeded(message, 'hi'),
          message_mr: await this.translateIfNeeded(message, 'mr'),
          problem_id: complaintId,
          data: data
        });

      if (error) {
        console.error('Notification creation error:', error);
        return false;
      }

      // Send real-time notification via Supabase
      await this.sendRealtimeNotification(userId, {
        type,
        title,
        message,
        complaintId,
        data
      });

      return true;
    } catch (error) {
      console.error('Notify citizen error:', error);
      return false;
    }
  }

  // Send notification to officer
  async notifyOfficer(officerId, type, title, message, complaintId = null, data = {}) {
    try {
      // Get officer's user ID
      const { data: officer, error: officerError } = await supabase
        .from('officers')
        .select('user_id')
        .eq('id', officerId)
        .single();

      if (officerError || !officer) {
        console.error('Officer not found:', officerId);
        return false;
      }

      // Create notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: officer.user_id,
          officer_id: officerId,
          type,
          title,
          message,
          problem_id: complaintId,
          data
        });

      if (error) {
        console.error('Officer notification error:', error);
        return false;
      }

      // Send real-time notification
      await this.sendRealtimeNotification(officer.user_id, {
        type,
        title,
        message,
        complaintId,
        data,
        role: 'officer'
      });

      return true;
    } catch (error) {
      console.error('Notify officer error:', error);
      return false;
    }
  }

  // Send notification to department
  async notifyDepartment(departmentId, type, title, message, complaintId = null, data = {}) {
    try {
      // Get all officers in department
      const { data: officers, error: officersError } = await supabase
        .from('officers')
        .select('id, user_id, name')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (officersError) {
        console.error('Department officers fetch error:', officersError);
        return false;
      }

      // Send notification to all officers
      const notifications = officers.map(officer => ({
        user_id: officer.user_id,
        officer_id: officer.id,
        type,
        title,
        message,
        problem_id: complaintId,
        data: { ...data, departmentId }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Department notification error:', error);
        return false;
      }

      // Send real-time notifications
      for (const officer of officers) {
        await this.sendRealtimeNotification(officer.user_id, {
          type,
          title,
          message,
          complaintId,
          data,
          role: 'officer'
        });
      }

      return true;
    } catch (error) {
      console.error('Notify department error:', error);
      return false;
    }
  }

  // Send real-time notification via Supabase
  async sendRealtimeNotification(userId, payload) {
    try {
      // Use Supabase realtime to send notification
      const channel = supabase.channel(`notifications:${userId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload
      });

      return true;
    } catch (error) {
      console.error('Realtime notification error:', error);
      return false;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          problems (id, title, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return notifications;
    } catch (error) {
      console.error('Get user notifications error:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Mark as read error:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      return false;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Helper: Get localized text
  getLocalizedText(config, field, language) {
    const langField = `${field}_${language}`;
    return config[langField] || config[field];
  }

  // Helper: Format message with data
  formatMessage(template, data, language = 'en') {
    let message = template;
    
    // Replace placeholders
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return message;
  }

  // Helper: Translate message if needed
  async translateIfNeeded(message, targetLang) {
    try {
      if (targetLang === 'en') {
        return message;
      }

      const result = await translationService.translateText(message, 'en', targetLang);
      return result.translatedText;
    } catch (error) {
      console.error('Translation error in notification:', error);
      return message; // Return original if translation fails
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(notifications) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        throw error;
      }

      // Send real-time notifications
      for (const notification of notifications) {
        await this.sendRealtimeNotification(notification.user_id, {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          complaintId: notification.problem_id,
          data: notification.data
        });
      }

      return true;
    } catch (error) {
      console.error('Bulk notifications error:', error);
      return false;
    }
  }

  // Clean old notifications
  async cleanOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_read', true);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Clean old notifications error:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();