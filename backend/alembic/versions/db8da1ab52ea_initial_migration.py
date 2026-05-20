"""Initial migration

Revision ID: db8da1ab52ea
Revises: 
Create Date: 2026-05-18 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'db8da1ab52ea'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('college', sa.String(), nullable=True),
        sa.Column('batch_year', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Preferences table
    op.create_table(
        'preferences',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('desired_role', sa.String(), nullable=True),
        sa.Column('desired_location', sa.String(), nullable=True),
        sa.Column('work_mode', sa.String(), nullable=True),
        sa.Column('experience_level', sa.String(), nullable=False, server_default='fresher'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Resumes table
    op.create_table(
        'resumes',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('parsed_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ats_score', sa.Float(), nullable=True),
        sa.Column('embedding', Vector(384), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Cached Jobs table
    op.create_table(
        'cached_jobs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('query_hash', sa.String(), nullable=False),
        sa.Column('results_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('fetched_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cached_jobs_query_hash'), 'cached_jobs', ['query_hash'], unique=True)

    # Skill Gap Caches table
    op.create_table(
        'skill_gap_caches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('job_hash', sa.String(), nullable=False),
        sa.Column('gap_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skill_gap_caches_job_hash'), 'skill_gap_caches', ['job_hash'], unique=False)

    # Feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('job_hash', sa.String(), nullable=False),
        sa.Column('rating', sa.SmallInteger(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_feedback_job_hash'), 'feedback', ['job_hash'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_feedback_job_hash'), table_name='feedback')
    op.drop_table('feedback')
    op.drop_index(op.f('ix_skill_gap_caches_job_hash'), table_name='skill_gap_caches')
    op.drop_table('skill_gap_caches')
    op.drop_index(op.f('ix_cached_jobs_query_hash'), table_name='cached_jobs')
    op.drop_table('cached_jobs')
    op.drop_table('resumes')
    op.drop_table('preferences')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.execute("DROP EXTENSION IF EXISTS vector")
