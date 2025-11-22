from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from middleware.auth_middleware import require_auth
from database.db_manager import DatabaseManager

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')
db = DatabaseManager()


@analytics_bp.route('/overview', methods=['GET'])
@require_auth
def get_analytics_overview():
    """Get analytics overview for client."""
    
    # Get all drafts
    all_drafts = db.get_drafts(request.client_id)
    
    # Calculate metrics
    total_quotes = len(all_drafts)
    approved = len([d for d in all_drafts if d['status'] == 'APPROVED'])
    pending = len([d for d in all_drafts if d['status'] == 'PENDING_APPROVAL'])
    rejected = len([d for d in all_drafts if d['status'] == 'REJECTED'])
    
    # Calculate revenue
    total_revenue = sum(d['total'] for d in all_drafts if d['status'] == 'APPROVED')
    pending_revenue = sum(d['total'] for d in all_drafts if d['status'] == 'PENDING_APPROVAL')
    
    # AI confidence stats
    confidences = [d.get('confidence', 50) for d in all_drafts if d.get('confidence')]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    # Approval rate
    approval_rate = (approved / total_quotes * 100) if total_quotes > 0 else 0
    
    # Revenue by month (last 6 months)
    revenue_by_month = []
    for i in range(6):
        month_start = datetime.now() - timedelta(days=30 * (5 - i))
        month_data = {
            'month': month_start.strftime('%b'),
            'revenue': 0,
            'quotes': 0
        }
        
        for draft in all_drafts:
            draft_date = datetime.fromisoformat(draft['created_at'])
            if (month_start.month == draft_date.month and 
                month_start.year == draft_date.year and 
                draft['status'] == 'APPROVED'):
                month_data['revenue'] += draft['total']
                month_data['quotes'] += 1
        
        revenue_by_month.append(month_data)
    
    return jsonify({
        'total_quotes': total_quotes,
        'approved': approved,
        'pending': pending,
        'rejected': rejected,
        'total_revenue': total_revenue,
        'pending_revenue': pending_revenue,
        'avg_confidence': round(avg_confidence, 1),
        'approval_rate': round(approval_rate, 1),
        'revenue_by_month': revenue_by_month
    })


@analytics_bp.route('/top-services', methods=['GET'])
@require_auth
def get_top_services():
    """Get most requested services."""
    
    # Get all drafts with line items
    all_drafts = db.get_drafts(request.client_id)
    
    # Count services
    service_counts = {}
    for draft in all_drafts:
        for item in draft.get('line_items', []):
            service_name = item.get('service_name', 'Unknown')
            if service_name in service_counts:
                service_counts[service_name] += item.get('quantity', 1)
            else:
                service_counts[service_name] = item.get('quantity', 1)
    
    # Sort and get top 10
    top_services = sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return jsonify([
        {'service': name, 'count': count}
        for name, count in top_services
    ])
