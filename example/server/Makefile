project := 
version := auto

setup:
	gcloud app create --project=$(project) || echo 'Passed app creation.'
	gcloud services enable datastore.googleapis.com --project=$(project) || echo 'Passed datastore setup.'
	for role in datastore.owner storage.objectAdmin ; do \
	  gcloud projects add-iam-policy-binding \
	    $(project) \
	    --member serviceAccount:`gcloud projects describe $(project) | sed -n "s/projectNumber: '\([0-9]*\)'/\1/p"`@cloudbuild.gserviceaccount.com \
	    --role roles/$$role ; \
	done

deploy:
	gcloud app deploy \
	  --project=$(project) \
	  --version=$(version) \
	  --verbosity=error \
	  -q \
	  app.yaml
