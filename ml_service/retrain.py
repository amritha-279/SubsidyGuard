"""
retrain.py
Periodic model retraining script. Can be scheduled via cron or Task Scheduler.
Run manually: python retrain.py
Or schedule: every night at midnight
"""

import os
import shutil
from datetime import datetime
from train_model import train

BACKUP_DIR = os.path.join(os.path.dirname(__file__), 'model_backups')

def retrain():
    print(f"[{datetime.now()}] Starting model retraining...")

    # Backup existing model
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    if os.path.exists(model_path):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(BACKUP_DIR, f'model_{timestamp}.pkl')
        shutil.copy(model_path, backup_path)
        print(f"Backed up existing model to: {backup_path}")

    # Retrain
    train()
    print(f"[{datetime.now()}] Retraining complete.")

if __name__ == '__main__':
    retrain()
