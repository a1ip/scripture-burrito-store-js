'use strict';

require = require("esm")(module/*, options*/);
const deepcopy = require('deepcopy');
const fse = require('fs-extra');
const path = require('path');
const assert = require('chai').assert;
const FSBurritoStore = require('../fs_burrito_store.js').FSBurritoStore;

describe("FS Burrito Class", function() {

    before(function() {
	this.storagePath = path.join(__dirname, "test_temp_storage");
	this.testDataDir = path.join(__dirname, "test_data");
	const metadataDir = path.join(this.testDataDir, "metadata");
	this.metadata = {
	    "validTextTranslation": JSON.parse(fse.readFileSync(path.join(metadataDir, "textTranslation.json"), "utf8")),
	    "scriptureTextNoRevision": JSON.parse(fse.readFileSync(path.join(metadataDir, "scriptureTextNoRevision.json"), "utf8")),
	    "scriptureTextDupRevision": JSON.parse(fse.readFileSync(path.join(metadataDir, "scriptureTextDupRevision.json"), "utf8")),
	    "validScriptureTextStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "stub.json"), "utf8")),
	    "emptyStub": {},
	    "obsoleteStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "obsolete_stub.json"), "utf8")),
	    "audioStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "audio_stub.json"), "utf8")),
	    "xStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "x_stub.json"), "utf8")),
	    "badServerStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "bad_server_stub.json"), "utf8")),
	    "bananaVariantStub": JSON.parse(fse.readFileSync(path.join(metadataDir, "banana_variant.json"), "utf8"))
	}
    });

    afterEach(function() {
	if ((fse.existsSync(this.storagePath))) {
	    fse.removeSync(this.storagePath);
	}
    });
    
    it("Constructs successfully", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	assert.exists(b);
	assert.equal(b._config.storeClass, "FSBurritoStore");
	assert.equal(b._config.validation, "burrito");
	assert.equal(b._config.acceptedVersion, "*");
	assert.equal(b._config.allowXFlavors, false);
	assert.equal(b._config.subclassSettings.foo, "baa");
    });

    it("Requires storeClass to match class", function() {
	try {
	    const b = new FSBurritoStore(
		{
		    "storeClass": "banana"
		},
		this.storagePath
	    );
	    throw Error("Too Far");
	} catch (err) {
	    assert.equal(err.message, "ConfigJsonForWrongClass");
	}
    });

    it("Throws error on invalid config", function() {
	try {
	    const b = new FSBurritoStore(
		{
		    "storeClass": "FSBurrito",
		    "foo": "baa"
		},
		this.storagePath
	    );
	    throw Error("Too Far");
	} catch (err) {
	    assert.equal(err.message, "ConfigFileInvalid");
	    const report = err.arg[0];
	    assert.isTrue("params" in report);
	    assert.isTrue("additionalProperty" in report.params);
	    assert.equal(report.params.additionalProperty, "foo");
	}
    });

    it("Implements importFromObject", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	b.importFromObject(this.metadata["validTextTranslation"]);
    });

    it("Allow import of identical metadata twice", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	b.importFromObject(this.metadata["validTextTranslation"]);
	b.importFromObject(this.metadata["validTextTranslation"]);
    });

    it("Do not allow import of different metadata for existing variant", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["validTextTranslation"]);
	    const modifiedMetadata = deepcopy(this.metadata["validTextTranslation"]);
	    modifiedMetadata["meta"]["generator"]["userName"] = "John Doe";
	    b.importFromObject(modifiedMetadata);
	    throw Error("Too Far");
	} catch (err) {
	    assert.equal(err.message, "CannotModifyExistingVariant");
	}
    });

    it("Throws exception from importFromObject on multiple revisions", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["scriptureTextDupRevision"]);
	    assert.exists(b);
	    throw Error("Too Far");
	} catch (err) {
	    assert.equal(err.message, "UnableToFindMetadataId");
	}
    });

    it("Throws exception from importFromObject on no revision", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito",
		"subclassSettings": {"foo": "baa"}
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["scriptureTextNoRevision"]);
	    assert.exists(b);
	    throw Error("Too Far");
	} catch (err) {
	    assert.equal(err.message, "UnableToFindMetadataId");
	}
    });

    it("Raises exception on adding variant with unsupported version", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedVersion": "0.2"
	},
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["obsoleteStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotConfigCompatible");
	    assert.equal(err.arg, "RejectedVersion");
	}
    });

    it("Raises exception on adding variant with x-flavor when not configured to accept", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["xStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotConfigCompatible");
	    assert.equal(err.arg, "RejectedFlavor");
	}
    });

    it("Accepts variant with x-flavor when configured to accept", function() {
	/* Schema invalid because metadata is stub */
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"allowXFlavors": true
	    },
	    this.storagePath
	);
	    try {
	    b.importFromObject(this.metadata["xStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotSchemaValid");
	}
    });

    it("Raises exception on adding variant with no accepted id", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedIdServers": ["https://thedigitalbiblelibrary.org"]
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["badServerStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotConfigCompatible");
	    assert.equal(err.arg, "NoAcceptableId");
	}
    });

    it("Accepts variant with explicit ID Server config", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedIdServers": ["https://thedigitalbiblelibrary.org"]
	    },
	    this.storagePath
	);
	b.importFromObject(this.metadata["validTextTranslation"]);
	assert.exists(b);
    });

    it("Raises exception on adding unknown variant", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedIdServers": ["https://thedigitalbiblelibrary.org"]
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["bananaVariantStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotConfigCompatible");
	    assert.equal(err.arg, "UnacceptableVariant");
	}
    });

    it("Accepts derived variant with * config", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedIdServers": ["https://thedigitalbiblelibrary.org"],
		"acceptedDerivedVariants": ["*"]
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["bananaVariantStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotSchemaValid");
	}
    });

    it("Accepts derived variant with explicit config", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"acceptedIdServers": ["https://thedigitalbiblelibrary.org"],
		"acceptedDerivedVariants": ["derived_banana"]
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["bananaVariantStub"]);
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "ImportedMetadataNotSchemaValid");
	}
    });

    it("Implements idServers()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.equal(b.idServers().length, 0);
	b.importFromObject(this.metadata["validTextTranslation"]);	
	assert.equal(b.idServers().length, 1);
	assert.equal(b.idServers()[0], "https://thedigitalbiblelibrary.org");
    });

    it("Implements idServersDetails()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.equal(Object.keys(b.idServersDetails()).length, 0);
	b.importFromObject(this.metadata["validTextTranslation"]);	
	assert.equal(Object.keys(b.idServersDetails()).length, 1);
	assert.equal(Object.keys(b.idServersDetails())[0], "https://thedigitalbiblelibrary.org");
	assert.equal(b.idServersDetails()["https://thedigitalbiblelibrary.org"]["id"], "https://thedigitalbiblelibrary.org");
    });

    it("Implements idServersEntries()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.equal(Object.keys(b.idServersEntries()).length, 0);
	b.importFromObject(this.metadata["validTextTranslation"]);	
	assert.equal(Object.keys(b.idServersEntries()).length, 1);
	assert.equal(b.idServersEntries()["https://thedigitalbiblelibrary.org"].length, 1);
    });

    it("Implements entries()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.isNull(b.entries("https://thedigitalbiblelibrary.org"));
	b.importFromObject(this.metadata["validTextTranslation"]);	
	assert.equal(b.entries("https://thedigitalbiblelibrary.org").length, 1);
    });

    it("Implements entriesRevisions()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.isNull(b.entriesRevisions("https://thedigitalbiblelibrary.org"));
	b.importFromObject(this.metadata["validTextTranslation"]);
	const entryKeys = Object.keys(b.entriesRevisions("https://thedigitalbiblelibrary.org"));
	assert.equal(entryKeys.length, 1);
	assert.equal(b.entriesRevisions("https://thedigitalbiblelibrary.org")[entryKeys[0]].length, 1);
    });

    it("Implements entryRevisions()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.isNull(b.entryRevisions("https://thedigitalbiblelibrary.org", "0123456789abcdef"));
	b.importFromObject(this.metadata["validTextTranslation"]);
	assert.equal(b.entryRevisions("https://thedigitalbiblelibrary.org", "0123456789abcdef").length, 1);
    });

    it("Implements entryRevisionsVariants()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.isNull(b.entryRevisionsVariants("https://thedigitalbiblelibrary.org", "0123456789abcdef"));
	b.importFromObject(this.metadata["validTextTranslation"]);
	const revisionKeys = Object.keys(b.entryRevisionsVariants("https://thedigitalbiblelibrary.org", "0123456789abcdef"));
	assert.equal(revisionKeys.length, 1);
	assert.equal(b.entryRevisionsVariants("https://thedigitalbiblelibrary.org", "0123456789abcdef")[revisionKeys[0]].length, 1);
    });

    it("Implements entryRevisionVariants()", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore"
	    },
	    this.storagePath
	);
	assert.isNull(b.entryRevisionVariants("https://thedigitalbiblelibrary.org", "0123456789abcdef", "23"));
	b.importFromObject(this.metadata["validTextTranslation"]);
	b.importFromObject(this.metadata["validTextTranslation"]);
	assert.equal(b.entryRevisionVariants("https://thedigitalbiblelibrary.org", "0123456789abcdef", "23").length, 1);
    });

    it("Implements exportToObject", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito"
	    },
	    this.storagePath
	);
	b.importFromObject(this.metadata["validTextTranslation"]);
	const md = b.exportToObject("https://thedigitalbiblelibrary.org", "0123456789abcdef", "23", "default");
	assert.isObject(md);
    });

    it("exportToObject raises exception if variant not found", function() {
	const b = new FSBurritoStore(
	    {
		"storeClass": "FSBurritoStore",
		"validation": "burrito"
	    },
	    this.storagePath
	);
	try {
	    b.importFromObject(this.metadata["validTextTranslation"]);
	    const md = b.exportToObject("https://thedigitalbiblelibrary.org", "0123456789abcdef", "99", "default");
	    throw new Error("Too Far", {});
	} catch (err) {
	    assert.equal(err.message, "VariantNotFoundInStore");
	}
    });

});
