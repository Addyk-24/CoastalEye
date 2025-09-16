
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers import Trainer, TrainingArguments
from sklearn.metrics import accuracy_score,f1_score
from torch.utils.data import Dataset



import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


import re
import nltk
nltk.download('stopwords')
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer


# df = pd.read_csv("../datasets/synthetic_hazard_dataset_1200.csv")
# ...existing code...
df = pd.read_csv("../datasets/synthetic_hazard_dataset_1200.csv")
# print(df.head())
# model_name = "bert-base-multilingual-cased"


# # Option 2: IndicBERT (better for Indian languages)
# model_name = "ai4bharat/indic-bert"

# # Option 3: XLM-RoBERTa (excellent multilingual performance)
# model_name = "xlm-roberta-base"

model_path = "FacebookAI/xlm-roberta-base"
fine_tuned_model_path = "Addyk24/Hazard_Classifier"
# model_path = "ai4bharat/indic-bert"

class HazardDataset(Dataset):
    def __init__(self,texts,labels,tokenizer,max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        item = {key: val.squeeze(0) for key, val in encoding.items()}
        item['labels'] = torch.tensor(int(label), dtype=torch.long)
        return item


class HazardClassifier:
    def __init__(self):
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = None
        self.label_mapping = {
            "tsunami": 0,
            "storm_surge": 1,
            "high_waves": 2,
            "coastal_flooding": 3,
            "swell_surge": 4,
            "rip_current": 5,
            "other": 6,
            "no_hazard": 7,
            "flood": 8,
            "abnormal_tide": 9,
        }
        
        # Create reverse mapping (integer to string) for predictions
        self.id2label = {v: k for k, v in self.label_mapping.items()}

    def load_model(self, model_path=fine_tuned_model_path):
        """Load a trained model"""
        path_to_use = model_path if model_path else self.model_path
        self.model = AutoModelForSequenceClassification.from_pretrained(path_to_use)
        self.model.eval()

    def preprocess_text(self,text,max_length=512):
        """Preprocess and Tokenize Text"""
        # cleaned_text = self._clean_text(text)

        # Tokenize 
        tokenized_text = self.tokenizer(
            text,
            truncation = True,
            padding = True,
            max_length = max_length,
            return_tensors = "pt"
        )

        return tokenized_text
    
    # def _clean_text(self):
    #     corpus = []
    #     len = 1000
    #     for i in range(len):
    #         statement = re.sub('[^a-zA-Z]',' ',len)
    #         statement = statement.lower()
    #         statement = statement.split()
    #         ps = PorterStemmer()

    
    def predict(self,text):
        """ Predict Hazard Type and Confidence """
        if self.model is None:
            raise ValueError("Model not Loaded")
        tokenzied_text = self.preprocess_text(text)

        with torch.no_grad():
            outputs = self.model(**tokenzied_text)
            prediction = torch.nn.functional.softmax(outputs.logits, dim=-1)

        prediction_class = torch.argmax(prediction,dim=-1).item()
        confidence = prediction[0][prediction_class].item() 

        return{
            "hazard_type":  self.id2label[prediction_class],
            "confidence" : float(confidence),
            "all_probabilities": {
                self.id2label[i]: float(prob) for i, prob in enumerate(prediction[0])

            }
        }

class HazardClassifierTrainer:
    def __init__(self):
        self.classifier = HazardClassifier()



    def prepare_dataset(self):
        """Prepare dataset for training with proper label conversion"""
        
        print("📊 Dataset Info:")
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        print(f"First few rows:\n{df.head()}")
        
        # Check unique labels in your dataset
        print(f"\n🏷️ Unique labels in dataset:")
        unique_labels = df['label'].unique()
        print(f"Found labels: {unique_labels}")
        
        # Clean and normalize labels
        df_clean = df.copy()
        df_clean['label'] = df_clean['label'].str.strip().str.lower()
        
        print(f"\nAfter cleaning:")
        cleaned_unique_labels = df_clean['label'].unique()
        print(f"Cleaned labels: {cleaned_unique_labels}")
        
        missing_labels = set(cleaned_unique_labels) - set(self.classifier.label_mapping.keys())
        if missing_labels:
            print(f"⚠️ WARNING: These labels are not in label_mapping: {missing_labels}")
            print("Available mappings:", list(self.classifier.label_mapping.keys()))
            

            print("Mapping unknown labels to 'other'")
            df_clean.loc[~df_clean['label'].isin(self.classifier.label_mapping.keys()), 'label'] = 'other'
        
        # Convert string labels to integers
        df_clean['label_id'] = df_clean['label'].map(self.classifier.label_mapping)
        
        # Check for any unmapped labels
        unmapped_mask = df_clean['label_id'].isna()
        if unmapped_mask.any():
            print(f"❌ ERROR: {unmapped_mask.sum()} labels could not be mapped!")
            print("Problematic labels:", df_clean[unmapped_mask]['label'].unique())
            # Remove unmapped rows
            df_clean = df_clean.dropna(subset=['label_id'])
            print(f"✅ Removed unmapped rows. New dataset size: {len(df_clean)}")
        
        # Convert label_id to int
        df_clean['label_id'] = df_clean['label_id'].astype(int)
        
        print(f"\n📋 Label distribution:")
        label_counts = df_clean['label'].value_counts()
        print(label_counts)
        
        # Split the data
        train_df, test_df = train_test_split(
            df_clean, 
            test_size=0.2, 
            stratify=df_clean['label_id'],
            random_state=42
        )
        
        print(f"\n📊 Data split:")
        print(f"Training samples: {len(train_df)}")
        print(f"Test samples: {len(test_df)}")
        
        # Create datasets
        train_dataset = HazardDataset(
            train_df['text_description'].tolist(),
            train_df['label_id'].tolist(),
            self.classifier.tokenizer
        )
        
        test_dataset = HazardDataset(
            test_df['text_description'].tolist(),
            test_df['label_id'].tolist(),
            self.classifier.tokenizer
        )
        
        return train_dataset, test_dataset
    
    def compute_metrics(self, eval_pred):

        """Compute metrics for evaluation"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        
        accuracy = accuracy_score(labels, predictions)
        f1 = f1_score(labels, predictions, average='weighted')
        
        # Return with proper eval_ prefix
        return {
            'eval_accuracy': accuracy,  # Add eval_ prefix
            'eval_f1': f1              # Add eval_ prefix
        }

    def train_model(self,train_dataset,test_dataset,output_dir="../trained_models/hazard_model"):
        """ Fine Tuning the Model """
        model = AutoModelForSequenceClassification.from_pretrained(
            self.classifier.model_path,
            num_labels = len(self.classifier.label_mapping),
            id2label=self.classifier.id2label,
            label2id=self.classifier.label_mapping

            )
        # Training Arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            warmup_steps=500,
            # logging_dir='./logs',
            weight_decay=0.01,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            # metric_for_best_model="eval_f1",
            greater_is_better=False,  # Important: for loss, lower is better

        )
        # Initialize Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=test_dataset,
            # compute_metrics=self.compute_metrics(test_dataset),
        )

        # Training
        trainer.train()

        # Save model
        trainer.save_model(output_dir)

        return trainer

    

def test_trained_model(model_dir="../trained_models/hazard_model"):
    """Test the trained model with sample predictions"""
    
    print("🔄 Loading trained model...")
    classifier = HazardClassifier()
    classifier.load_model(model_dir)

    # Try loading tokenizer from fine-tuned folder, fallback to base model
    try:
        classifier.tokenizer = AutoTokenizer.from_pretrained(model_dir)
    except Exception:
        print("⚠️ Tokenizer not found in fine-tuned folder. Using base model tokenizer.")
        classifier.tokenizer = AutoTokenizer.from_pretrained("xlm-roberta-base")
    
    # Test samples
    test_samples = [
        "There is a warning for high waves along the coast.",
        "Tsunami alert! Water receding from beach rapidly!",
        "Heavy flooding in coastal areas due to storm surge",
        "Rip current warning issued for swimmers",
        "Normal weather conditions, no hazards reported",
        "मुंबई में तेज लहरें और तूफान की चेतावनी",  # Hindi text
        "Large waves hitting the shore, people evacuating"
    ]
    
    print("\n🧪 Testing predictions:")
    print("=" * 80)
    
    for i, text in enumerate(test_samples, 1):
        try:
            result = classifier.predict(text)
            print(f"\n{i}. Text: {text}")
            print(f"   Predicted: {result['hazard_type']} (confidence: {result['confidence']:.3f})")
            
            # Show top 3 predictions
            sorted_probs = sorted(result['all_probabilities'].items(), 
                                key=lambda x: x[1], reverse=True)
            print(f"   Top 3: {sorted_probs[:3]}")
            
        except Exception as e:
            print(f"❌ Error predicting for text {i}: {e}")
    
    print("\n✅ Testing complete!")

if __name__ == "__main__":
    
    print("🏗️ Initializing Hazard Classifier Trainer...")
    
    try:
        # Train the model
        # trainer = HazardClassifierTrainer()
        # train_dataset, test_dataset = trainer.prepare_dataset()
        # trained_model = trainer.train_model(train_dataset, test_dataset)
        
        # print("\n✅ Training completed successfully!")
        
        # Test the trained model
        test_trained_model()
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

# Prediction: {'hazard_type': 'tsunami', 'confidence': 0.5275659561157227, 'all_probabilities': {'tsunami': 0.5275659561157227, 'storm_surge': 0.4724341034889221}}       