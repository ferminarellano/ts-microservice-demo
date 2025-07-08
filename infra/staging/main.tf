terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "outreach-terraform-state"
    prefix = "cloud-run-demo"
  }
}

provider "google" {
  credentials = file(var.gcp_credentials_file)
  project     = var.project_id
  region      = var.region
}

resource "google_cloud_run_service" "default" {
  name     = "engage-microservice"
  location = var.region

  template {
    spec {
      containers {
        image = var.docker_image
        resources {
          limits = {
            memory = "256Mi"
            cpu    = "0.25"
          }
        }
        ports {
          container_port = 3000
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

resource "google_cloud_run_service_iam_member" "invoker" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_service.default.name

  role   = "roles/run.invoker"
  member = "allUsers"
}
