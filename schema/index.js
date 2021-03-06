module.exports = {
    schemaIds: {
	"metadata": "https://burrito.bible/schema/metadata.schema.json",
	"config": "https://burrito.bible/schema/store/config.schema.json"
    },
    schemas: [
        require('./agency.schema.json'),
        require('./common.schema.json'),
        require('./confidentiality.schema.json'),
        require('./copyright.schema.json'),
        require('./country.schema.json'),
        require('./identification.schema.json'),
        require('./ingredient.schema.json'),
        require('./language.schema.json'),
        require('./meta.schema.json'),
        require('./metadata.schema.json'),
        require('./name.schema.json'),
        require('./promotion.schema.json'),
        require('./relationship.schema.json'),
        require('./type.schema.json'),
        require('./gloss/glossedTextStory.schema.json'),
        require('./parascriptural/parascripturalWordAlignment.schema.json'),
        require('./peripheral/peripheralVersification.schema.json'),
        require('./scripture/scriptureAudio.schema.json'),
        require('./scripture/scriptureBraille.schema.json'),
        require('./scripture/scripturePrint.schema.json'),
        require('./scripture/scriptureSignLanguageVideo.schema.json'),
        require('./scripture/scriptureText.schema.json'),

	require('./config.schema.json')
    ]
};
