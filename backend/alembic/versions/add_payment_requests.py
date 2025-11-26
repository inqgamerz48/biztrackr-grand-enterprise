"""
Database migration script to create payment_requests table
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_payment_requests'
down_revision = None  # Update this with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create payment_requests table
    op.create_table(
        'payment_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='USD'),
        sa.Column('plan_type', sa.String(50)),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('reference_number', sa.String(100), unique=True),
        sa.Column('bank_details', postgresql.JSON()),
        sa.Column('payment_proof_url', sa.String(500)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approved_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_payment_requests_id', 'payment_requests', ['id'])
    op.create_index('ix_payment_requests_tenant_id', 'payment_requests', ['tenant_id'])
    op.create_index('ix_payment_requests_reference_number', 'payment_requests', ['reference_number'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_payment_requests_reference_number')
    op.drop_index('ix_payment_requests_tenant_id')
    op.drop_index('ix_payment_requests_id')
    
    # Drop table
    op.drop_table('payment_requests')
