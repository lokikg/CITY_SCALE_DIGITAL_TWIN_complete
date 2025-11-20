"""initial migration

Revision ID: 001
Revises: 
Create Date: 2025-08-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create all tables
    op.create_table('traffic_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('vehicle_count', sa.Integer(), nullable=False),
        sa.Column('avg_speed', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('air_quality_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('pm25', sa.Float(), nullable=False),
        sa.Column('pm10', sa.Float(), nullable=False),
        sa.Column('no2', sa.Float(), nullable=False),
        sa.Column('co', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('noise_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('decibel_level', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('weather_stations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('humidity', sa.Float(), nullable=False),
        sa.Column('rainfall', sa.Float(), nullable=False),
        sa.Column('wind_speed', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('smart_meters',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('electricity_usage', sa.Float(), nullable=False),
        sa.Column('water_usage', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('waste_bins',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('fill_level', sa.Float(), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('parking_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('is_occupied', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('street_lights',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Boolean(), nullable=False),
        sa.Column('energy_consumption', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('public_transport_trackers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('bus_id', sa.String(), nullable=False),
        sa.Column('occupancy', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('surveillance_cameras',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('motion_detected', sa.Boolean(), nullable=False),
        sa.Column('object_count', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('water_quality_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('ph', sa.Float(), nullable=False),
        sa.Column('turbidity', sa.Float(), nullable=False),
        sa.Column('dissolved_oxygen', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('energy_grid_sensors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('voltage', sa.Float(), nullable=False),
        sa.Column('current', sa.Float(), nullable=False),
        sa.Column('frequency', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Drop all tables
    op.drop_table('traffic_sensors')
    op.drop_table('air_quality_sensors')
    op.drop_table('noise_sensors')
    op.drop_table('weather_stations')
    op.drop_table('smart_meters')
    op.drop_table('waste_bins')
    op.drop_table('parking_sensors')
    op.drop_table('street_lights')
    op.drop_table('public_transport_trackers')
    op.drop_table('surveillance_cameras')
    op.drop_table('water_quality_sensors')
    op.drop_table('energy_grid_sensors')
