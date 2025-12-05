"""Add warehouse management tables

Revision ID: wms_001
Revises: 
Create Date: 2025-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'wms_001'
down_revision = None  # Replace with your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Create warehouses table
    op.create_table(
        'warehouses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('capacity', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouses_id'), 'warehouses', ['id'], unique=False)
    op.create_index(op.f('ix_warehouses_name'), 'warehouses', ['name'], unique=False)

    # Create warehouse_zones table
    op.create_table(
        'warehouse_zones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('zone_type', sa.String(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouse_zones_id'), 'warehouse_zones', ['id'], unique=False)
    op.create_index(op.f('ix_warehouse_zones_name'), 'warehouse_zones', ['name'], unique=False)

    # Create warehouse_bins table
    op.create_table(
        'warehouse_bins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bin_code', sa.String(), nullable=False),
        sa.Column('zone_id', sa.Integer(), nullable=False),
        sa.Column('capacity', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('current_load', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['zone_id'], ['warehouse_zones.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bin_code')
    )
    op.create_index(op.f('ix_warehouse_bins_id'), 'warehouse_bins', ['id'], unique=False)
    op.create_index(op.f('ix_warehouse_bins_bin_code'), 'warehouse_bins', ['bin_code'], unique=True)

    # Create bin_stocks table
    op.create_table(
        'bin_stocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bin_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['bin_id'], ['warehouse_bins.id'], ),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bin_stocks_id'), 'bin_stocks', ['id'], unique=False)

    # Create stock_movements table
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('from_bin_id', sa.Integer(), nullable=True),
        sa.Column('to_bin_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('moved_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('moved_by', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['from_bin_id'], ['warehouse_bins.id'], ),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['moved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['to_bin_id'], ['warehouse_bins.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_movements_id'), 'stock_movements', ['id'], unique=False)

    # Create inward_logs table
    op.create_table(
        'inward_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('purchase_order_id', sa.Integer(), nullable=True),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('quantity_received', sa.Integer(), nullable=False),
        sa.Column('bin_id', sa.Integer(), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('quality_check_status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['bin_id'], ['warehouse_bins.id'], ),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['purchase_order_id'], ['purchases.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inward_logs_id'), 'inward_logs', ['id'], unique=False)

    # Create outward_logs table
    op.create_table(
        'outward_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('quantity_picked', sa.Integer(), nullable=False),
        sa.Column('bin_id', sa.Integer(), nullable=True),
        sa.Column('picked_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('picked_by', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['bin_id'], ['warehouse_bins.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['picked_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_outward_logs_id'), 'outward_logs', ['id'], unique=False)

    # Create demand_history table
    op.create_table(
        'demand_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('quantity_sold', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_demand_history_id'), 'demand_history', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_demand_history_id'), table_name='demand_history')
    op.drop_table('demand_history')
    
    op.drop_index(op.f('ix_outward_logs_id'), table_name='outward_logs')
    op.drop_table('outward_logs')
    
    op.drop_index(op.f('ix_inward_logs_id'), table_name='inward_logs')
    op.drop_table('inward_logs')
    
    op.drop_index(op.f('ix_stock_movements_id'), table_name='stock_movements')
    op.drop_table('stock_movements')
    
    op.drop_index(op.f('ix_bin_stocks_id'), table_name='bin_stocks')
    op.drop_table('bin_stocks')
    
    op.drop_index(op.f('ix_warehouse_bins_bin_code'), table_name='warehouse_bins')
    op.drop_index(op.f('ix_warehouse_bins_id'), table_name='warehouse_bins')
    op.drop_table('warehouse_bins')
    
    op.drop_index(op.f('ix_warehouse_zones_name'), table_name='warehouse_zones')
    op.drop_index(op.f('ix_warehouse_zones_id'), table_name='warehouse_zones')
    op.drop_table('warehouse_zones')
    
    op.drop_index(op.f('ix_warehouses_name'), table_name='warehouses')
    op.drop_index(op.f('ix_warehouses_id'), table_name='warehouses')
    op.drop_table('warehouses')
